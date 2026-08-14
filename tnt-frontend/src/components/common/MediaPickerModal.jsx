import { useState, useEffect } from 'react';
import { X, Search, Upload, RefreshCw, CheckCircle, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { mediaApi } from '../../api/services';

export default function MediaPickerModal({ isOpen, onClose, onSelect }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, fileType]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await mediaApi.getMedia({ search, fileType });
      if (res.success && res.assets) {
        setAssets(res.assets);
      }
    } catch (err) {
      console.error('Failed to fetch media assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAssets();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'tnt');

      const res = await mediaApi.uploadMedia(formData);
      if (res.success && res.asset) {
        const newAsset = res.asset;
        setAssets([newAsset, ...assets]);
        setSelectedAsset(newAsset);
      }
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSelectConfirm = () => {
    if (selectedAsset) {
      onSelect(selectedAsset.url);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-paper border border-line rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-line">
          <span className="font-extrabold text-xs uppercase text-ink tracking-wider flex items-center gap-2">
            🖼️ Select Media Asset
          </span>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-line bg-stone/30 flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-paper border border-line rounded px-8 py-1.5 text-xs text-ink focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
            </div>
            <button type="submit" className="px-3 py-1.5 bg-ink text-paper text-xs font-bold rounded uppercase">
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="bg-paper border border-line rounded px-2 py-1.5 text-xs text-ink focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>

            <button
              onClick={fetchAssets}
              className="p-2 border border-line rounded text-ink bg-paper hover:bg-stone/50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-line rounded text-xs font-bold text-ink hover:bg-stone/50 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : 'Upload File'}
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
            </label>
          </div>
        </div>

        {/* Grid and Details */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[50vh] md:max-h-none">
            {loading ? (
              <div className="col-span-full py-16 flex items-center justify-center text-xs text-muted">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading media library assets...
              </div>
            ) : assets.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-muted">
                No matching media assets found. Upload files above to add assets.
              </div>
            ) : (
              assets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    onDoubleClick={() => {
                      onSelect(asset.url);
                      onClose();
                    }}
                    className={`relative aspect-square border rounded-lg overflow-hidden cursor-pointer group transition-all ${
                      isSelected ? 'border-ink ring-2 ring-ink/20' : 'border-line hover:border-ink/50'
                    }`}
                  >
                    {asset.fileType === 'video' ? (
                      <div className="w-full h-full bg-black/90 flex flex-col items-center justify-center p-2 text-white">
                        <Video className="w-8 h-8 mb-1" />
                        <span className="text-[9px] truncate max-w-full text-center">{asset.filename}</span>
                      </div>
                    ) : (
                      <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover" />
                    )}

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-ink text-paper rounded-full p-0.5">
                        <CheckCircle className="w-3.5 h-3.5 fill-ink stroke-paper" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Details Panel */}
          {selectedAsset && (
            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-line p-4 bg-stone/10 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <span className="font-bold text-[10px] uppercase text-muted tracking-wider block">Asset Info</span>
                <div className="aspect-video border border-line rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
                  {selectedAsset.fileType === 'video' ? (
                    <Video className="w-10 h-10 text-muted" />
                  ) : (
                    <img src={selectedAsset.url} alt={selectedAsset.filename} className="max-w-full max-h-full object-contain" />
                  )}
                </div>
                <div className="space-y-2 text-[11px] text-ink font-medium">
                  <div className="truncate">
                    <span className="text-muted block text-[9px] uppercase">Filename</span>
                    {selectedAsset.filename}
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Public ID</span>
                    <span className="font-mono text-[9px]">{selectedAsset.publicId}</span>
                  </div>
                  {selectedAsset.width && (
                    <div>
                      <span className="text-muted block text-[9px] uppercase">Dimensions</span>
                      {selectedAsset.width} × {selectedAsset.height} px
                    </div>
                  )}
                  {selectedAsset.fileSize && (
                    <div>
                      <span className="text-muted block text-[9px] uppercase">Size</span>
                      {(selectedAsset.fileSize / 1024).toFixed(1)} KB
                    </div>
                  )}
                  {selectedAsset.usageCount !== undefined && (
                    <div>
                      <span className="text-muted block text-[9px] uppercase">Used In</span>
                      <span className={`${selectedAsset.usageCount > 0 ? 'text-green-600 font-bold' : 'text-red-500'}`}>
                        {selectedAsset.usageCount} location(s)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-line mt-4">
                <button
                  type="button"
                  onClick={handleSelectConfirm}
                  className="w-full py-2 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90"
                >
                  INSERT SELECTED ASSET
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
