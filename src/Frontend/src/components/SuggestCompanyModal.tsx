import React, { useState } from 'react';
import { X, Building2, Globe, Briefcase, Plus, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { SuggestCompanyRequest } from '../types';

interface SuggestCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SuggestCompanyModal: React.FC<SuggestCompanyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [careersUrl, setCareersUrl] = useState('');
  const [category, setCategory] = useState<number>(2);
  const [techStackInput, setTechStackInput] = useState('');
  const [globalProducts, setGlobalProducts] = useState('');
  const [headquarters, setHeadquarters] = useState('Dhaka, Bangladesh');
  const [workModel, setWorkModel] = useState('Hybrid');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !website.trim()) {
      setErrorMessage('Company Name and Website are required.');
      return;
    }

    const techStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload: SuggestCompanyRequest = {
      name: name.trim(),
      website: website.trim(),
      careersUrl: careersUrl.trim() || website.trim(),
      category: Number(category),
      primaryTechStack: techStack.length > 0 ? techStack : ['Technology', 'Software Engineering'],
      globalProducts: globalProducts.trim() || undefined,
      headquarters: headquarters.trim() || 'Dhaka, Bangladesh',
      workModel: workModel.trim() || 'Hybrid',
      description: description.trim() || undefined
    };

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.companies.suggest(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#007070]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Suggest a Company</h2>
            <p className="text-xs text-slate-500">Contribute to the Bangladesh Global Tech Ecosystem directory</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NewsCred, Optimizely, TigerIT"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007070] focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  required
                  placeholder="https://company.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007070] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Careers URL
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  placeholder="https://company.com/careers"
                  value={careersUrl}
                  onChange={(e) => setCareersUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007070] focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry Cluster <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007070] focus:border-transparent outline-none bg-white"
              >
                <option value={1}>Enterprise & Global IT Outsourcing</option>
                <option value={2}>Global SaaS & Products</option>
                <option value={3}>Fintech & High-Scale Systems</option>
                <option value={4}>Cloud, DevOps & Infra</option>
                <option value={5}>AI & Data Intelligence</option>
                <option value={6}>Digital Agency & Consulting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Model
              </label>
              <select
                value={workModel}
                onChange={(e) => setWorkModel(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007070] focus:border-transparent outline-none bg-white"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Tech Stack (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. .NET, C#, React, Azure, Docker, Python"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007070] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Global Products / Key Offerings
            </label>
            <input
              type="text"
              placeholder="e.g. Optimizely Experimentation, Welcome CMS"
              value={globalProducts}
              onChange={(e) => setGlobalProducts(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007070] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Headquarters / BD Office Location
            </label>
            <input
              type="text"
              placeholder="Dhaka, Bangladesh"
              value={headquarters}
              onChange={(e) => setHeadquarters(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007070] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Brief Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief overview of engineering focus or products built..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007070] focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#007070] hover:bg-[#005a5a] rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Adding...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Submit Company</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
