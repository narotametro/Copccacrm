import { useState } from 'react';
import { FileText, Upload, Sparkles, Trash2, Edit2, CheckCircle2, RefreshCw, X, ArrowLeft, FileUp, Clipboard } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useReports } from '../lib/use-reports';
import { toast } from 'sonner@2.0.3';
import { PageHeader } from './shared/PageHeader';

export function Reports() {
  const { user } = useAuth();
  const { reports, loading, createReport, updateReport, deleteReport } = useReports();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('file');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setFormData(prev => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
    }));

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFormData(prev => ({
        ...prev,
        content: text,
      }));
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleCreateReport = async (type: 'quick' | 'full') => {
    if (!formData.title || !formData.content) {
      toast.error('Please provide both title and content');
      return;
    }

    setIsProcessing(true);
    try {
      const reportData = {
        type,
        title: formData.title,
        content: formData.content,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
      };

      await createReport(reportData);
      toast.success('Report created and analyzed successfully');
      
      // Reset form
      setFormData({ title: '', content: '' });
      setSelectedFile(null);
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create report');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateReport = async () => {
    if (!editingReport || !formData.title || !formData.content) {
      toast.error('Please provide both title and content');
      return;
    }

    setIsProcessing(true);
    try {
      await updateReport(editingReport.id, {
        title: formData.title,
        content: formData.content,
      });
      toast.success('Report updated successfully');
      
      // Reset form
      setFormData({ title: '', content: '' });
      setEditingReport(null);
      setShowEditModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update report');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteReport = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteReport(id);
      toast.success('Report deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete report');
    }
  };

  const openEditModal = (report: any) => {
    setEditingReport(report);
    setFormData({
      title: report.title,
      content: report.content,
    });
    setShowEditModal(true);
  };

  const openCreateModal = (type: 'quick' | 'full') => {
    setFormData({ title: '', content: '' });
    setSelectedFile(null);
    setUploadMethod(type === 'full' ? 'file' : 'paste');
    setShowCreateModal(true);
  };

  const getModuleBadgeColor = (module: string) => {
    const colors: Record<string, string> = {
      aftersales: 'bg-pink-100 text-pink-700',
      kpi: 'bg-green-100 text-green-700',
      competitors: 'bg-purple-100 text-purple-700',
      sales: 'bg-orange-100 text-orange-700',
      marketing: 'bg-amber-100 text-amber-700',
      debt: 'bg-blue-100 text-blue-700',
    };
    return colors[module] || 'bg-gray-100 text-gray-700';
  };

  const getModuleName = (module: string) => {
    const names: Record<string, string> = {
      aftersales: 'After-Sales',
      kpi: 'KPI',
      competitors: 'Competitors',
      sales: 'Sales',
      marketing: 'Marketing',
      debt: 'Debt Collection',
    };
    return names[module] || module;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <a
        href="#/home"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <ArrowLeft size={20} />
        <span>Back to Home</span>
      </a>

      {/* Header */}
      <PageHeader
        title="Reports"
        description="Create and analyze reports with AI-powered insights"
        icon={FileText}
      />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => openCreateModal('quick')}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors flex items-center gap-2"
        >
          <Sparkles size={18} />
          Create Quick Report
        </button>
        <button
          onClick={() => openCreateModal('full')}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors flex items-center gap-2"
        >
          <Upload size={18} />
          Upload Full Report
        </button>
      </div>

      {/* All Reports List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg mb-4">All Reports</h3>
        
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="animate-spin mx-auto mb-4 text-pink-500" size={32} />
            <p className="text-gray-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 mb-2">No reports yet</p>
            <p className="text-sm text-gray-500">
              Create your first report to get AI-powered insights
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-pink-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-white rounded-lg">
                      {report.type === 'quick' ? (
                        <Sparkles className="text-pink-500" size={24} />
                      ) : (
                        <FileText className="text-blue-500" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">{report.title}</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs uppercase ${
                            report.type === 'quick'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {report.type}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            report.status === 'processed'
                              ? 'bg-green-100 text-green-700'
                              : report.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>Created by {report.createdByName}</span>
                        <span>•</span>
                        <span>{new Date(report.createdAt).toLocaleString()}</span>
                        {report.fileName && (
                          <>
                            <span>•</span>
                            <span>{report.fileName}</span>
                          </>
                        )}
                        {report.fileSize && (
                          <>
                            <span>•</span>
                            <span>{(report.fileSize / 1024).toFixed(2)} KB</span>
                          </>
                        )}
                      </div>
                      
                      {/* AI Insights */}
                      {report.insights && report.insights.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            <CheckCircle2 size={14} className="text-green-500" />
                            AI Analysis Complete ({report.insights.reduce((acc: number, i: any) => acc + i.insights.length, 0)} insights)
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {report.insights.map((insight: any, idx: number) => (
                              <span
                                key={idx}
                                className={`px-2 py-1 rounded text-xs ${getModuleBadgeColor(insight.module)}`}
                              >
                                {getModuleName(insight.module)}: {insight.insights.length} insights
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(report)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id, report.title)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl mb-1">
                  {uploadMethod === 'file' ? 'Upload Report' : 'Create Report'}
                </h3>
                <p className="text-sm text-gray-600">
                  {uploadMethod === 'file'
                    ? 'Upload a file for AI-powered analysis'
                    : 'Write your report and get AI insights'}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Title Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Report Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter report title..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Upload Method Selection */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setUploadMethod('file')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    uploadMethod === 'file'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileUp size={18} />
                    <span>Upload File</span>
                  </div>
                </button>
                <button
                  onClick={() => setUploadMethod('paste')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    uploadMethod === 'paste'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Clipboard size={18} />
                    <span>Write/Paste Text</span>
                  </div>
                </button>
              </div>

              {/* File Upload */}
              {uploadMethod === 'file' ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-4 ${
                    isDragging
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-300 hover:border-pink-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="space-y-3">
                      <FileText className="mx-auto text-pink-500" size={48} />
                      <div>
                        <p className="font-semibold">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setFormData(prev => ({ ...prev, content: '' }));
                        }}
                        className="text-sm text-pink-600 hover:text-pink-700"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="mx-auto text-gray-400" size={48} />
                      <div>
                        <p className="mb-1">Drag and drop your report here</p>
                        <p className="text-sm text-gray-600 mb-3">or</p>
                        <label className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 cursor-pointer inline-block">
                          Browse Files
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        Supports TXT, PDF, DOC, DOCX, XLSX, XLS (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Text Content */
                <div className="space-y-3 mb-4">
                  <label className="block text-sm font-medium">Report Content *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write or paste your report content here..."
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}

              {/* AI Processing Info */}
              <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-pink-500 flex-shrink-0" size={20} />
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900 mb-1">
                      AI-Powered Analysis
                    </p>
                    <p className="text-gray-600">
                      Our AI will automatically extract insights and update relevant activities across:
                    </p>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>• After-Sales Follow-up</li>
                      <li>• KPI Tracking</li>
                      <li>• Competitors Information</li>
                      <li>• Sales & Marketing Strategies</li>
                      <li>• Debt Collection</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateReport(uploadMethod === 'file' ? 'full' : 'quick')}
                  disabled={isProcessing || !formData.title || !formData.content}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl mb-1">Edit Report</h3>
                <p className="text-sm text-gray-600">
                  Update your report and re-analyze with AI
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Title Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Report Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter report title..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Content */}
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium">Report Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your report here..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateReport}
                  disabled={isProcessing || !formData.title || !formData.content}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Update Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}