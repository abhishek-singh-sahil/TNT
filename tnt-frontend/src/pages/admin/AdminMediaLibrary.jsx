import { useState, useEffect } from 'react';
import { Trash2, FolderSync, Search, Upload, RefreshCw, FileText, Image as ImageIcon, Video, X, Edit3, Clipboard, Check, Copy } from 'lucide-react';
import { mediaApi } from '../../api/services';

export default function AdminMediaLibrary() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [uploading, setUploading] = useState(false);

  // Modals state
  const [previewAsset, setPreviewAsset] = useState(null);
  const [deleteWarningAsset, setDeleteWarningAsset] = useState(null);
  const [renameAsset, setRenameAsset] = useState(null);
  const [newFilename, setNewFilename] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchMedia();
  }, [fileType, selectedFolder]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await mediaApi.getMedia({ search, fileType, folder: selectedFolder });
      if (res.success && res.assets) {
        setAssets(res.assets);
      }
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedia();
  };

  const handleCloudinarySync = async () => {
    try {
      setSyncing(true);
      const res = await mediaApi.syncCloudinary();
      if (res.success) {
        alert(res.message);
        fetchMedia();
      }
    } catch (err) {
      alert('Sync failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'tnt');
        await mediaApi.uploadMedia(formData);
      }
      fetchMedia();
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleRenameClick = (asset) => {
    setRenameAsset(asset);
    setNewFilename(asset.filename);
  };

  const handleRenameConfirm = async () => {
    if (!newFilename.trim()) return;
    try {
      const res = await mediaApi.renameMedia(renameAsset.id, newFilename.trim());
      if (res.success) {
        setAssets(assets.map(a => a.id === renameAsset.id ? { ...a, filename: newFilename.trim() } : a));
        setRenameAsset(null);
      }
    } catch (err) {
      alert('Rename failed');
    }
  };

  const handleDeleteRequest = (asset) => {
    if (asset.usageCount > 0) {
      setDeleteWarningAsset(asset);
    } else {
      confirmDelete(asset.id);
    }
  };

  const confirmDelete = async (id, force = false) => {
    try {
      const res = await mediaApi.deleteMedia(id, force);
      if (res.success) {
        setAssets(assets.filter(a => a.id !== id));
        setDeleteWarningAsset(null);
      }
    } catch (err) {
      alert('Deletion failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} assets?`)) return;

    try {
      setLoading(true);
      for (const id of selectedIds) {
        await mediaApi.deleteMedia(id, true);
      }
      setAssets(assets.filter(a => !selectedIds.includes(a.id)));
      setSelectedIds([]);
    } catch (err) {
      alert('Bulk deletion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Dashboard Stats Calculations
  const totalSize = assets.reduce((sum, a) => sum + (a.fileSize || 0), 0);
  const imagesCount = assets.filter(a => a.fileType === 'image').length;
  const videosCount = assets.filter(a => a.fileType === 'video').length;
  const unusedCount = assets.filter(a => a.usageCount === 0).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight uppercase text-ink">Media Asset Library</h1>
          <p className="text-xs text-muted">Manage central static assets directly integrated with Cloudinary CDN.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCloudinarySync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 border border-line rounded text-xs font-bold text-ink hover:bg-stone/50 bg-paper uppercase disabled:opacity-50"
          >
            <FolderSync className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Cloudinary'}
          </button>
          <label className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper rounded text-xs font-bold uppercase hover:bg-ink/90 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Asset'}
            <input type="file" multiple onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-paper border border-line rounded-lg p-4 space-y-1">
          <span className="text-[10px] font-bold text-muted uppercase block">Total Files</span>
          <span className="text-2xl font-black text-ink">{assets.length} Assets</span>
        </div>
        <div className="bg-paper border border-line rounded-lg p-4 space-y-1">
          <span className="text-[10px] font-bold text-muted uppercase block">Storage Space</span>
          <span className="text-2xl font-black text-ink">{(totalSize / (1024 * 1024)).toFixed(1)} MB</span>
        </div>
        <div className="bg-paper border border-line rounded-lg p-4 space-y-1">
          <span className="text-[10px] font-bold text-muted uppercase block">Images / Videos</span>
          <span className="text-2xl font-black text-ink">{imagesCount} img / {videosCount} vid</span>
        </div>
        <div className="bg-paper border border-line rounded-lg p-4 space-y-1">
          <span className="text-[10px] font-bold text-muted uppercase block">Unused Assets</span>
          <span className="text-2xl font-black text-ink text-red-500">{unusedCount} Assets</span>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-paper border border-line rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by filename or folder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone border border-line rounded px-8 py-2 text-xs text-ink focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
          </div>
          <button type="submit" className="px-4 py-2 bg-ink text-paper text-xs font-bold rounded uppercase">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-bold uppercase hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
            </button>
          )}

          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
          >
            <option value="all">All Filetypes</option>
            <option value="image">Images Only</option>
            <option value="video">Videos Only</option>
          </select>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-24 text-center text-xs text-muted flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-8 h-8 animate-spin" /> Loading Central Media Library...
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-paper border border-line rounded-lg py-24 text-center text-xs text-muted">
          No assets registered. Click "Upload Asset" or "Sync Cloudinary" above.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {assets.map((asset) => {
            const isSelected = selectedIds.includes(asset.id);
            return (
              <div
                key={asset.id}
                className={`bg-paper border rounded-xl overflow-hidden shadow-xs group relative flex flex-col transition-all duration-200 ${
                  isSelected ? 'border-ink ring-2 ring-ink/10' : 'border-line hover:border-ink/50'
                }`}
              >
                {/* Checkbox selector */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(asset.id)}
                  className="absolute top-2.5 left-2.5 z-10 w-4 h-4 rounded border-line focus:ring-0 cursor-pointer"
                />

                {/* Media Preview Box */}
                <div
                  onClick={() => setPreviewAsset(asset)}
                  className="aspect-square bg-stone/40 border-b border-line flex items-center justify-center overflow-hidden cursor-pointer relative"
                >
                  {asset.fileType === 'video' ? (
                    <div className="text-center p-3 text-ink">
                      <Video className="w-12 h-12 mx-auto mb-1 opacity-70" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Video Clip</span>
                    </div>
                  ) : (
                    <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}

                  {asset.usageCount > 0 && (
                    <span className="absolute bottom-2 right-2 bg-green-100 text-green-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                      IN USE ({asset.usageCount})
                    </span>
                  )}
                </div>

                {/* Info Text */}
                <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[11px] text-ink block truncate" title={asset.filename}>
                      {asset.filename}
                    </span>
                    <span className="text-[9px] text-muted font-mono block truncate">
                      ID: {asset.publicId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-2 mt-2 gap-1">
                    <button
                      onClick={() => handleCopyUrl(asset.url, asset.id)}
                      className="p-1.5 border border-line rounded hover:bg-stone text-muted hover:text-ink flex items-center justify-center"
                      title="Copy secure link URL"
                    >
                      {copiedId === asset.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => handleRenameClick(asset)}
                      className="p-1.5 border border-line rounded hover:bg-stone text-muted hover:text-ink flex items-center justify-center"
                      title="Rename file metadata"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(asset)}
                      className="p-1.5 border border-line rounded hover:bg-red-50 text-red-500 flex items-center justify-center"
                      title="Delete asset permanently"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal Popup */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider truncate">
                Asset Details: {previewAsset.filename}
              </span>
              <button onClick={() => setPreviewAsset(null)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 aspect-video sm:aspect-square max-h-64 border border-line rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
                {previewAsset.fileType === 'video' ? (
                  <video src={previewAsset.url} controls className="max-w-full max-h-full" />
                ) : (
                  <img src={previewAsset.url} alt={previewAsset.filename} className="max-w-full max-h-full object-contain" />
                )}
              </div>
              <div className="flex-1 space-y-3 text-xs text-ink font-medium">
                <div>
                  <span className="text-[9px] uppercase text-muted block">Public ID</span>
                  <span className="font-mono">{previewAsset.publicId}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-muted block">Cloud URL</span>
                  <a href={previewAsset.url} target="_blank" rel="noreferrer" className="text-ink underline break-all font-mono">
                    {previewAsset.url}
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] uppercase text-muted block">File Size</span>
                    {(previewAsset.fileSize / 1024).toFixed(1)} KB
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-muted block">Type</span>
                    <span className="capitalize">{previewAsset.fileType}</span>
                  </div>
                </div>
                {previewAsset.width && (
                  <div>
                    <span className="text-[9px] uppercase text-muted block">Dimensions</span>
                    {previewAsset.width} × {previewAsset.height} px
                  </div>
                )}
                <div>
                  <span className="text-[9px] uppercase text-muted block">Used In</span>
                  {previewAsset.usageCount === 0 ? (
                    <span className="text-red-500 font-semibold">Not used anywhere</span>
                  ) : (
                    <div className="space-y-1 mt-1 max-h-24 overflow-y-auto">
                      {previewAsset.usedIn.map((u, index) => (
                        <div key={index} className="text-[10px] bg-stone px-2 py-1 rounded border border-line flex items-center justify-between">
                          <span className="font-bold">{u.type}: {u.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal Popup */}
      {renameAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-3.5">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-ink">✏️ Rename Asset</span>
              <button onClick={() => setRenameAsset(null)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1 font-semibold">Filename</label>
                <input
                  type="text"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  className="w-full border border-line rounded px-3 py-1.5 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleRenameConfirm}
                className="w-full py-2 bg-ink text-paper text-xs font-bold uppercase rounded"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Warning Modal Popup */}
      {deleteWarningAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-red-600">⚠️ Asset In Use Warning</span>
              <button onClick={() => setDeleteWarningAsset(null)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-ink font-semibold">
                The asset <span className="font-extrabold underline">{deleteWarningAsset.filename}</span> is currently being used in <span className="text-red-500 font-extrabold">{deleteWarningAsset.usageCount} location(s)</span>:
              </p>
              <div className="space-y-1 max-h-36 overflow-y-auto border border-line rounded p-2 bg-stone/20">
                {deleteWarningAsset.usedIn.map((u, i) => (
                  <div key={i} className="text-[10px] text-muted py-0.5 border-b border-line last:border-0 font-medium">
                    • <span className="font-extrabold text-ink">{u.type}</span>: {u.name}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted italic">
                Deleting this file will delete it from Cloudinary and break image references in these locations.
              </p>
              <div className="flex gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setDeleteWarningAsset(null)}
                  className="flex-1 py-2 bg-stone text-ink text-xs font-bold uppercase rounded border border-line"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmDelete(deleteWarningAsset.id, true)}
                  className="flex-1 py-2 bg-red-600 text-paper text-xs font-bold uppercase rounded hover:bg-red-700"
                >
                  Delete Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
