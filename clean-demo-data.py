#!/usr/bin/env python3
"""
Script to remove all demo data from COPCCA-CRM
Replaces demo data arrays with empty arrays
"""

import re
import os

# Files and their demo array patterns
files_to_clean = [
    {
        'path': 'src/pages/Customers.tsx',
        'pattern': r'(const demoCompanies: Company\[\] = )\[[^\]]*\];',
        'replacement': r'\1[];'
    },
    {
        'path': 'src/pages/Products.tsx',
        'pattern': r'(const demoProducts: Product\[\] = )\[[^\]]*\];',
        'replacement': r'\1[];'
    },
    {
        'path': 'src/pages/AfterSales.tsx',
        'pattern': r'(const demoTasks: Task\[\] = )\[[^\]]*\];',
        'replacement': r'\1[];'
    },
    {
        'path': 'src/pages/DebtCollection.tsx',
        'pattern': r'(const demoDebts: Debt\[\] = )\[[^\]]*\];',
        'replacement': r'\1[];'
    },
    {
        'path': 'src/pages/SalesPipeline.tsx',
        'pattern': r'(const demoDeals: Deal\[\] = )\[[^\]]*\];',
        'replacement': r'\1[];'
    },
    {
        'path': 'src/pages/SalesStrategies.tsx',
        'pattern': r'(const demoCampaigns: Campaign\[\] = )\[[^\]]*\];',
        'replacement': r'\1[];'
    },
    {
        'path': 'src/pages/Competitors.tsx',
        'pattern': r'(const demoCompetitors: Competitor\[\] = )\[[^\]]*\];',
        'replacement': r'\1[];'
    },
    {
        'path': 'src/pages/Notifications.tsx',
        'pattern': r'(const demoNotifications: Notification\[\] = )\[[^\]]*\];',
        'replacement': r'\1[];'
    },
    {
        'path': 'src/context/SharedDataContext.tsx',
        'arrays': [
            'demoCustomers: Customer',
            'demoDeals: Deal',
            'demoProducts: Product',
            'demoInvoices: Invoice',
            'demoTickets: SupportTicket',
            'demoLeads: Lead',
            'demoCompetitorDeals: CompetitorDeal'
        ]
    }
]

def clean_file(filepath, pattern, replacement):
    """Clean a single file by replacing pattern with replacement"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the array declaration and its closing bracket
        # Use DOTALL to match across newlines
        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✓ Cleaned {filepath}")
            return True
        else:
            print(f"- No changes in {filepath}")
            return False
    except Exception as e:
        print(f"✗ Error cleaning {filepath}: {e}")
        return False

def clean_shared_context():
    """Special handling for SharedDataContext with multiple arrays"""
    filepath = 'src/context/SharedDataContext.tsx'
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace each demo array one by one
        patterns = [
            (r'const demoCustomers: Customer\[\] = \[[\s\S]*?\n\];', 'const demoCustomers: Customer[] = [];'),
            (r'const demoDeals: Deal\[\] = \[[\s\S]*?\n\];', 'const demoDeals: Deal[] = [];'),
            (r'const demoProducts: Product\[\] = \[[\s\S]*?\n\];', 'const demoProducts: Product[] = [];'),
            (r'const demoInvoices: Invoice\[\] = \[[\s\S]*?\n\];', 'const demoInvoices: Invoice[] = [];'),
            (r'const demoTickets: SupportTicket\[\] = \[[\s\S]*?\n\];', 'const demoTickets: SupportTicket[] = [];'),
            (r'const demoLeads: Lead\[\] = \[[\s\S]*?\n\];', 'const demoLeads: Lead[] = [];'),
            (r'const demoCompetitorDeals: CompetitorDeal\[\] = \[[\s\S]*?\n\];', 'const demoCompetitorDeals: CompetitorDeal[] = [];'),
        ]
        
        modified = False
        for pattern, replacement in patterns:
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                modified = True
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Cleaned {filepath}")
            return True
        else:
            print(f"- No changes in {filepath}")
            return False
    except Exception as e:
        print(f"✗ Error cleaning {filepath}: {e}")
        return False

# Main execution
print("🧹 Cleaning all demo data from COPCCA-CRM...\n")

cleaned_count = 0

# Clean individual page files
for file_config in files_to_clean:
    if file_config['path'] == 'src/context/SharedDataContext.tsx':
        # Handle SharedDataContext separately
        if clean_shared_context():
            cleaned_count += 1
    else:
        # Clean regular files
        if clean_file(file_config['path'], file_config['pattern'], file_config['replacement']):
            cleaned_count += 1

print(f"\n✅ Done! Cleaned {cleaned_count} files")
print("All demo data has been removed. System is ready for production.")
