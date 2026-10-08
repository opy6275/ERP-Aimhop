"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  UploadCloud,
  Trash2,
  Download,
  Eye,
  Plus,
  X,
  FileCheck,
  CheckCircle2,
  AlertCircle,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export type StaffDocItem = {
  id: string;
  type: string;
  fileName: string;
  fileKey: string;
  createdAt: string;
};

export function StaffDocumentsSection({
  staffId,
  canUpload = true,
  canDelete = true,
}: {
  staffId: string;
  canUpload?: boolean;
  canDelete?: boolean;
}) {
  const [docs, setDocs] = useState<StaffDocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("aadhaar");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/staff/${staffId}/documents`);
      if (res.ok) {
        const json = await res.json();
        setDocs(json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (staffId) loadDocs();
  }, [staffId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.size > 5 * 1024 * 1024) {
        setError("File size cannot exceed 5MB");
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(f);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const res = await fetch(`/api/v1/staff/${staffId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: docType,
            fileName: selectedFile.name,
            fileData: base64Data,
          }),
        });

        if (res.ok) {
          setOpenModal(false);
          setSelectedFile(null);
          loadDocs();
        } else {
          const errJson = await res.json();
          setError(errJson.error || "Upload failed");
        }
        setUploading(false);
      };

      reader.onerror = () => {
        setError("Failed to read file");
        setUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch {
      setError("An unexpected error occurred during upload");
      setUploading(false);
    }
  }

  async function handleDelete(docId: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/v1/staff/${staffId}/documents?docId=${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== docId));
      } else {
        alert("Could not delete document");
      }
    } catch {
      alert("Network error");
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case "aadhaar":
        return <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase">Aadhaar</span>;
      case "pan":
        return <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">PAN Card</span>;
      case "resume":
        return <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">Resume</span>;
      case "contract":
        return <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700 uppercase">Contract</span>;
      default:
        return <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 uppercase">{type}</span>;
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck size={18} className="text-blue-600" />
            <span>KYC & Verified Documents Vault</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Government identification proofs, resumes, and employment agreements
          </p>
        </div>

        {canUpload && (
          <Button
            type="button"
            size="sm"
            onClick={() => setOpenModal(true)}
            className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs"
          >
            <Plus size={14} />
            <span>Upload Document</span>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading document vault…</div>
      ) : docs.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <UploadCloud size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-700">No documents uploaded yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Upload Aadhaar, PAN card, Resume, or Offer Letter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 hover:bg-white hover:border-blue-200 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-44 sm:max-w-xs">{doc.fileName}</p>
                    {getTypeBadge(doc.type)}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Uploaded on {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={doc.fileKey}
                  download={doc.fileName}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-blue-700 transition"
                  title="Download / View"
                >
                  <Download size={14} />
                </a>

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id, doc.fileName)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5">
              <h4 className="text-sm font-bold text-slate-900">Upload Staff Document</h4>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Classification
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value="aadhaar">Aadhaar Card (National ID)</option>
                  <option value="pan">PAN Card (Tax ID)</option>
                  <option value="resume">Resume / Curriculum Vitae</option>
                  <option value="contract">Employment Contract / Offer Letter</option>
                  <option value="other">Education / Other Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select File (PDF, PNG, JPG - max 5MB)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={uploading || !selectedFile}
                  loading={uploading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Upload & Store
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
