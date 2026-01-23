-- Migration to add feedback_count and pain_points columns to companies table
-- Run this in your Supabase SQL Editor
--
-- These columns will be populated by aggregating data from customer_feedback table
-- feedback_count: Total number of feedback entries for the company
-- pain_points: Array of identified pain points from customer feedback

-- Add feedback_count column
ALTER TABLE companies ADD COLUMN IF NOT EXISTS feedback_count INTEGER DEFAULT 0;
COMMENT ON COLUMN companies.feedback_count IS 'Total number of customer feedback entries';

-- Add pain_points column
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pain_points TEXT[];
COMMENT ON COLUMN companies.pain_points IS 'Array of identified customer pain points from feedback analysis';

-- Create function to update feedback_count and pain_points
CREATE OR REPLACE FUNCTION update_company_feedback_metrics(company_uuid UUID)
RETURNS void AS $$
DECLARE
    feedback_count_val INTEGER;
    pain_points_val TEXT[];
BEGIN
    -- Count total feedback entries
    SELECT COUNT(*) INTO feedback_count_val
    FROM customer_feedback
    WHERE company_id = company_uuid;

    -- Extract pain points from negative feedback (this is a simplified approach)
    -- In a real implementation, you might want more sophisticated NLP analysis
    SELECT array_agg(DISTINCT lower(trim(feedback_text)))
    INTO pain_points_val
    FROM customer_feedback
    WHERE company_id = company_uuid
      AND type IN ('complaint', 'review')
      AND rating <= 3
      AND feedback_text IS NOT NULL
      AND length(trim(feedback_text)) > 10; -- Only meaningful feedback

    -- Update the company record
    UPDATE companies
    SET
        feedback_count = COALESCE(feedback_count_val, 0),
        pain_points = COALESCE(pain_points_val, '{}')
    WHERE id = company_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update metrics when feedback is added/updated
CREATE OR REPLACE FUNCTION trigger_update_company_feedback_metrics()
RETURNS trigger AS $$
BEGIN
    -- Update metrics for the affected company
    PERFORM update_company_feedback_metrics(
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.company_id
            ELSE NEW.company_id
        END
    );

    RETURN CASE
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on customer_feedback table
DROP TRIGGER IF EXISTS trigger_customer_feedback_metrics ON customer_feedback;
CREATE TRIGGER trigger_customer_feedback_metrics
    AFTER INSERT OR UPDATE OR DELETE ON customer_feedback
    FOR EACH ROW EXECUTE FUNCTION trigger_update_company_feedback_metrics();