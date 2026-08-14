import { useState, useEffect, useRef } from 'react';
import {
  Trash2,
  FolderSync,
  Search,
  Upload,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Video,
  X,
  Edit,
  Clipboard,
  Check,
  Copy,
  MoreVertical,
  Plus,
  Folder,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  FileDown
} from 'lucide-react';
import { mediaApi } from '../../api/services';
import toast from 'react-hot-toast';

export default function AdminMediaLibrary() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [sort, setSort] = useState('newest');

  // Stats
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalStorage: 0,
    folders: [],
    typeCounts: []
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 12;

  // Selected item for details sidebar
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameAsset, setRenameAsset] = useState(null);
  const [newFilename, setNewFilename] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveAsset, setMoveAsset] = useState(null);
  const [targetFolder, setTargetFolder] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAsset, setDeleteAsset] = useState(null);
  const [deleteForce, setDeleteForce] = useState(false);
  const [deleteUsages, setDeleteUsages] = useState([]);

  // Bulk Move Modal
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [bulkTargetFolder, setBulkTargetFolder] = useState('');

  // Dropdowns & UI states
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const menuRef = useRef({});

  // Upload Progress
  const [uploads, setUploads] = useState([]); // Array of { id, name, progress, status }
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMedia();
  }, [fileType, selectedFolder, sort, page]);

  // Click outside listener to close menus
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeMenuId && !event.target.closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await mediaApi.getMedia({
        search,
        fileType,
        folder: selectedFolder,
        sort,
        page,
        limit
      });
      if (res.success) {
        setAssets(res.assets || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalItems(res.pagination.total || 0);
        }
        if (res.stats) {
          // Adjust folders to aggregate with counts
          setStats(res.stats);
        }
        // Retain selected asset update if it exists in the fetched list
        if (selectedAsset) {
          const updated = (res.assets || []).find(a => a.id === selectedAsset.id);
          if (updated) setSelectedAsset(updated);
        } else if (res.assets && res.assets.length > 0) {
          setSelectedAsset(res.assets[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load media assets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMedia();
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const folderName = newFolderName.trim().toLowerCase();
      // On backend folders are implicit, we can just trigger a mock action or directly reload/select it.
      // We will set selectedFolder to this folder and let upload trigger its creation.
      setSelectedFolder(folderName);
      setNewFolderName('');
      setShowFolderModal(false);
      toast.success(`Folder "${folderName}" selected. Upload files to instantiate it.`);
      setPage(1);
    } catch (err) {
      toast.error('Failed to create folder');
    }
  };

  // Multiple File Upload with progress tracking
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Add files to upload progress list
    const newUploads = files.map(file => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      progress: 0,
      status: 'uploading'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadItem = newUploads[i];

      const formData = new FormData();
      formData.append('file', file);
      // Pass currently selected folder as destination, fallback to 'tnt' if 'all' is selected
      formData.append('folder', selectedFolder === 'all' ? 'tnt' : selectedFolder);

      try {
        await mediaApi.uploadMedia(formData, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploads(prev => prev.map(item =>
            item.id === uploadItem.id ? { ...item, progress: percentCompleted } : item
          ));
        });

        setUploads(prev => prev.map(item =>
          item.id === uploadItem.id ? { ...item, status: 'success', progress: 100 } : item
        ));
      } catch (err) {
        setUploads(prev => prev.map(item =>
          item.id === uploadItem.id ? { ...item, status: 'error', reason: err.message || 'Upload failed' } : item
        ));
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    // Refresh media library
    fetchMedia();
    // Auto clean uploads progress indicator after 5 seconds
    setTimeout(() => {
      setUploads([]);
    }, 5000);
  };

  // Copy shareable relative URL
  const handleCopyUrl = (url, id) => {
    // Generate absolute link dynamically based on host to work from both domains
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success('Usable URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Secure File Download trigger
  const handleDownload = (asset) => {
    const downloadUrl = mediaApi.downloadMediaUrl(asset.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', asset.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metadata Updates (Rename / Move)
  const openRenameModal = (asset) => {
    setRenameAsset(asset);
    setNewFilename(asset.filename);
    setShowRenameModal(true);
  };

  const handleRenameConfirm = async () => {
    if (!newFilename.trim()) return;
    try {
      const res = await mediaApi.renameMedia(renameAsset.id, newFilename.trim());
      if (res.success) {
        toast.success('Asset renamed successfully');
        setAssets(assets.map(a => a.id === renameAsset.id ? { ...a, filename: newFilename.trim() } : a));
        if (selectedAsset?.id === renameAsset.id) {
          setSelectedAsset({ ...selectedAsset, filename: newFilename.trim() });
        }
        setShowRenameModal(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to rename asset');
    }
  };

  const openMoveModal = (asset) => {
    setMoveAsset(asset);
    setTargetFolder(asset.folder || 'tnt');
    setShowMoveModal(true);
  };

  const handleMoveConfirm = async () => {
    if (!targetFolder.trim()) return;
    try {
      const res = await mediaApi.moveMedia(moveAsset.id, targetFolder.trim());
      if (res.success) {
        toast.success(`Asset moved to folder "${targetFolder}"`);
        setAssets(assets.map(a => a.id === moveAsset.id ? { ...a, folder: targetFolder.trim() } : a));
        if (selectedAsset?.id === moveAsset.id) {
          setSelectedAsset({ ...selectedAsset, folder: targetFolder.trim() });
        }
        setShowMoveModal(false);
        fetchMedia(); // Refresh folders count
      }
    } catch (err) {
      toast.error('Failed to move asset');
    }
  };

  // Safe deletion validation
  const openDeleteModal = (asset) => {
    setDeleteAsset(asset);
    setDeleteForce(false);
    setDeleteUsages(asset.usedIn || []);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await mediaApi.deleteMedia(deleteAsset.id, deleteForce);
      if (res.success) {
        toast.success('Asset deleted successfully');
        setAssets(assets.filter(a => a.id !== deleteAsset.id));
        if (selectedAsset?.id === deleteAsset.id) {
          setSelectedAsset(assets.find(a => a.id !== deleteAsset.id) || null);
        }
        setShowDeleteModal(false);
        fetchMedia(); // Refresh folders/stats counts
      }
    } catch (err) {
      if (err.message && err.message.includes('in use')) {
        toast.error('Asset is in use. Check confirmation checkbox to delete anyway.');
      } else {
        toast.error(err.message || 'Deletion failed');
      }
    }
  };

  // Bulk Actions
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  };

  const handleBulkDelete = async () => {
    // Check usages of selected items
    const selectedAssets = assets.filter(a => selectedIds.includes(a.id));
    const itemsInUse = selectedAssets.filter(a => a.usageCount > 0);

    let confirmMsg = `Are you sure you want to delete ${selectedIds.length} assets?`;
    if (itemsInUse.length > 0) {
      confirmMsg = `WARNING: ${itemsInUse.length} of the selected assets are currently active/in use. Deleting them might break site elements. Delete anyway?`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await mediaApi.bulkDelete(selectedIds, true);
      if (res.success) {
        toast.success(res.message || 'Bulk delete finished');
        setSelectedIds([]);
        fetchMedia();
      }
    } catch (err) {
      toast.error('Bulk deletion failed');
    }
  };

  const handleBulkMove = async () => {
    if (!bulkTargetFolder.trim()) return;
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await mediaApi.moveMedia(id, bulkTargetFolder.trim());
        if (res.success) successCount++;
      }
      toast.success(`Moved ${successCount} assets to "${bulkTargetFolder}"`);
      setSelectedIds([]);
      setShowBulkMoveModal(false);
      fetchMedia();
    } catch (err) {
      toast.error('Bulk move operation encountered errors');
    }
  };

  // Helper formatting size
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight uppercase text-ink">Media Library</h1>
          <p className="text-xs text-muted">Manage and organize all your media files in one place</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-paper border border-line rounded px-8 py-2 text-xs text-ink focus:outline-none w-56 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-muted absolute left-3" />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  setTimeout(fetchMedia, 50);
                }}
                className="absolute right-3 text-muted hover:text-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Add Media Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-ink text-paper rounded text-xs font-bold uppercase hover:bg-ink/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Media
          </button>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,application/pdf"
          />
        </div>
      </div>

      {/* 2. Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-paper border border-line rounded-xl p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Files</span>
            <div className="p-1.5 bg-ink/5 rounded-lg text-ink">
              <Folder className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-ink">{stats.totalFiles || 0}</span>
            <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
              <span>↑ 12%</span> <span className="text-muted">vs last month</span>
            </span>
          </div>
        </div>

        <div className="bg-paper border border-line rounded-xl p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Folders</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Folder className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-ink">{stats.folders?.length || 0}</span>
            <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
              <span>↑ 0%</span> <span className="text-muted">vs last month</span>
            </span>
          </div>
        </div>

        <div className="bg-paper border border-line rounded-xl p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Storage Used</span>
            <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
              <FileDown className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-ink">{formatBytes(stats.totalStorage)}</span>
            <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
              <span>↑ 8%</span> <span className="text-muted">vs last month</span>
            </span>
          </div>
        </div>

        <div className="bg-paper border border-line rounded-xl p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">File Types</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-ink">{stats.typeCounts?.length || 0}</span>
            <span className="text-[10px] text-muted font-bold block truncate">
              {stats.typeCounts?.map(t => t.type?.toUpperCase()).join(', ') || 'No filetypes'}
            </span>
          </div>
        </div>
      </div>

      {/* Uploads Progress Drawer/Widget */}
      {uploads.length > 0 && (
        <div className="bg-stone border border-line rounded-xl p-4 space-y-2 max-w-xl">
          <h4 className="text-xs font-bold uppercase text-ink flex items-center justify-between">
            <span>Uploading Files</span>
            <button onClick={() => setUploads([])} className="text-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {uploads.map(item => (
              <div key={item.id} className="text-[10px] space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="truncate text-ink max-w-[70%]">{item.name}</span>
                  <span className={item.status === 'error' ? 'text-red-500' : 'text-muted'}>
                    {item.status === 'uploading' ? `${item.progress}%` : item.status === 'success' ? 'Completed' : 'Failed'}
                  </span>
                </div>
                <div className="w-full bg-paper rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${item.status === 'error' ? 'bg-red-500' : 'bg-ink'}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Main Dashboard: Sidebar (Left), Media Grid (Center), Details Panel (Right) */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Sidebar Folders & Quick Filters */}
        <div className="w-full lg:w-60 flex-shrink-0 space-y-6">
          <div className="bg-paper border border-line rounded-xl p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="font-extrabold text-[10px] uppercase text-ink tracking-wider flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" /> Folders
              </span>
              <button
                onClick={() => setShowFolderModal(true)}
                className="p-1 hover:bg-stone rounded text-muted hover:text-ink"
                title="Create folder placeholder"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-0.5">
              <button
                onClick={() => { setSelectedFolder('all'); setPage(1); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold uppercase flex items-center justify-between transition-colors ${
                  selectedFolder === 'all' ? 'bg-stone text-ink' : 'text-muted hover:bg-stone/40 hover:text-ink'
                }`}
              >
                <span>📁 All Files</span>
                <span className="text-[10px] bg-ink/5 px-2 py-0.5 rounded font-bold text-ink">
                  {stats.totalFiles}
                </span>
              </button>

              {stats.folders?.map(folder => (
                <button
                  key={folder.name}
                  onClick={() => { setSelectedFolder(folder.name); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold uppercase flex items-center justify-between transition-colors ${
                    selectedFolder === folder.name ? 'bg-stone text-ink' : 'text-muted hover:bg-stone/40 hover:text-ink'
                  }`}
                >
                  <span className="truncate">📂 {folder.name}</span>
                  <span className="text-[10px] bg-ink/5 px-2 py-0.5 rounded font-bold text-ink">
                    {folder.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Filters */}
            <div className="border-t border-line pt-4 space-y-2">
              <span className="font-extrabold text-[10px] uppercase text-ink tracking-wider block">
                Quick Filters
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setFileType(fileType === 'image' ? 'all' : 'image'); setPage(1); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold uppercase flex items-center justify-between transition-colors ${
                    fileType === 'image' ? 'bg-stone/80 text-ink font-extrabold' : 'text-muted hover:bg-stone/30 hover:text-ink'
                  }`}
                >
                  <span>🖼️ Images</span>
                  <span>{stats.typeCounts?.find(t => t.type === 'image')?.count || 0}</span>
                </button>
                <button
                  onClick={() => { setFileType(fileType === 'video' ? 'all' : 'video'); setPage(1); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold uppercase flex items-center justify-between transition-colors ${
                    fileType === 'video' ? 'bg-stone/80 text-ink font-extrabold' : 'text-muted hover:bg-stone/30 hover:text-ink'
                  }`}
                >
                  <span>🎥 Videos</span>
                  <span>{stats.typeCounts?.find(t => t.type === 'video')?.count || 0}</span>
                </button>
                <button
                  onClick={() => { setFileType(fileType === 'document' ? 'all' : 'document'); setPage(1); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold uppercase flex items-center justify-between transition-colors ${
                    fileType === 'document' ? 'bg-stone/80 text-ink font-extrabold' : 'text-muted hover:bg-stone/30 hover:text-ink'
                  }`}
                >
                  <span>📄 Documents</span>
                  <span>{stats.typeCounts?.find(t => t.type === 'document')?.count || 0}</span>
                </button>
                <button
                  onClick={() => { setFileType(fileType === 'other' ? 'all' : 'other'); setPage(1); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold uppercase flex items-center justify-between transition-colors ${
                    fileType === 'other' ? 'bg-stone/80 text-ink font-extrabold' : 'text-muted hover:bg-stone/30 hover:text-ink'
                  }`}
                >
                  <span>⚙️ Icons / Other</span>
                  <span>{stats.typeCounts?.find(t => t.type === 'other')?.count || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Section: Toolbar & Grid */}
        <div className="flex-1 space-y-4">
          
          {/* Grid Toolbar Controls */}
          <div className="bg-paper border border-line rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xs">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={assets.length > 0 && selectedIds.length === assets.length}
                  onChange={toggleSelectAll}
                  className="rounded border-line focus:ring-0 cursor-pointer w-4 h-4 text-ink"
                />
                <span>Select All ({selectedIds.length})</span>
              </label>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-bold uppercase hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  <button
                    onClick={() => {
                      setBulkTargetFolder('tnt');
                      setShowBulkMoveModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone border border-line text-ink rounded text-[10px] font-bold uppercase hover:bg-paper transition-colors"
                  >
                    <Folder className="w-3.5 h-3.5" /> Move
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-[10px] font-bold uppercase text-muted">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="bg-stone border border-line rounded px-3 py-1.5 text-xs text-ink focus:outline-none font-semibold cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="size_desc">Largest</option>
                <option value="size_asc">Smallest</option>
              </select>
            </div>
          </div>

          {/* Media Grid */}
          {loading ? (
            <div className="bg-paper border border-line rounded-xl py-32 text-center text-xs text-muted flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" /> Load media assets...
            </div>
          ) : assets.length === 0 ? (
            <div className="bg-paper border border-line rounded-xl py-32 text-center text-xs text-muted">
              No media files found matching selected folder/filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {assets.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                const isActive = selectedAsset?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`bg-paper border rounded-xl overflow-hidden shadow-xs group relative flex flex-col transition-all duration-200 cursor-pointer ${
                      isActive ? 'ring-2 ring-ink' : ''
                    } ${isSelected ? 'border-ink' : 'border-line hover:border-ink/50'}`}
                  >
                    {/* Checkbox Selector */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(asset.id)}
                      className="absolute top-2.5 left-2.5 z-10 w-4 h-4 rounded border-line focus:ring-0 cursor-pointer text-ink"
                    />

                    {/* Image Preview Box */}
                    <div className="aspect-square bg-stone/40 border-b border-line flex items-center justify-center overflow-hidden relative">
                      {asset.fileType === 'video' ? (
                        <div className="text-center p-3 text-ink">
                          <Video className="w-12 h-12 mx-auto mb-1 opacity-70" />
                          <span className="text-[10px] font-bold uppercase tracking-wider block">Video</span>
                        </div>
                      ) : asset.fileType === 'document' ? (
                        <div className="text-center p-3 text-ink">
                          <FileText className="w-12 h-12 mx-auto mb-1 opacity-70" />
                          <span className="text-[10px] font-bold uppercase tracking-wider block">Doc</span>
                        </div>
                      ) : (
                        <img
                          src={asset.url}
                          alt={asset.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      {asset.usageCount > 0 && (
                        <span className="absolute bottom-2 right-2 bg-green-50 border border-green-200 text-green-800 text-[8px] font-extrabold px-2 py-0.5 rounded">
                          IN USE ({asset.usageCount})
                        </span>
                      )}
                    </div>

                    {/* Metadata summary */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="font-bold text-[11px] text-ink block truncate" title={asset.filename}>
                          {asset.filename}
                        </span>
                        <span className="text-[9px] text-muted block font-semibold">
                          {formatBytes(asset.fileSize)} • {formatDate(asset.createdAt)}
                        </span>
                      </div>

                      {/* Card Action Dot Menu */}
                      <div className="flex justify-between items-center border-t border-line pt-2 mt-auto">
                        <span className="text-[9px] bg-stone px-1.5 py-0.5 rounded font-mono text-muted uppercase font-bold truncate max-w-[80px]">
                          {asset.folder || 'tnt'}
                        </span>

                        <div className="relative action-menu-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === asset.id ? null : asset.id);
                            }}
                            className="p-1 hover:bg-stone rounded text-muted hover:text-ink"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeMenuId === asset.id && (
                            <div className="absolute right-0 bottom-full mb-1 w-32 bg-paper border border-line rounded-lg shadow-lg z-20 py-1 text-xs">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyUrl(asset.url, asset.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-stone flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wide text-ink"
                              >
                                {copiedId === asset.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                Copy URL
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(asset);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-stone flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wide text-ink"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRenameModal(asset);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-stone flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wide text-ink"
                              >
                                <Edit className="w-3 h-3" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openMoveModal(asset);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-stone flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wide text-ink"
                              >
                                <Folder className="w-3 h-3" />
                                Move
                              </button>
                              <hr className="border-line my-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(asset);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wide"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="bg-paper border border-line rounded-xl p-4 flex justify-between items-center text-xs font-semibold text-muted shadow-xs">
              <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} of {totalItems} assets</span>
              <div className="flex gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 bg-stone border border-line rounded disabled:opacity-50 text-ink hover:bg-paper"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 bg-stone border border-line rounded disabled:opacity-50 text-ink hover:bg-paper"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Details Panel */}
        <div className="w-full lg:w-72 flex-shrink-0">
          {selectedAsset ? (
            <div className="bg-paper border border-line rounded-xl p-4 shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b border-line pb-2.5">
                <span className="font-extrabold text-[10px] uppercase text-ink tracking-wider">File Details</span>
                <button
                  onClick={() => openRenameModal(selectedAsset)}
                  className="p-1 hover:bg-stone rounded text-muted hover:text-ink"
                  title="Edit filename"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Detail Preview Frame */}
              <div className="aspect-square bg-stone border border-line rounded-lg overflow-hidden flex items-center justify-center">
                {selectedAsset.fileType === 'video' ? (
                  <video src={selectedAsset.url} controls className="max-w-full max-h-full" />
                ) : selectedAsset.fileType === 'document' ? (
                  <FileText className="w-20 h-20 text-muted" />
                ) : (
                  <img src={selectedAsset.url} alt={selectedAsset.filename} className="max-w-full max-h-full object-contain" />
                )}
              </div>

              {/* Details List */}
              <div className="space-y-2 text-xs text-ink font-medium">
                <div className="flex justify-between py-1 border-b border-line/50">
                  <span className="text-muted">File Name:</span>
                  <span className="truncate max-w-[160px] font-bold" title={selectedAsset.filename}>
                    {selectedAsset.filename}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/50">
                  <span className="text-muted">File Size:</span>
                  <span className="font-bold">{formatBytes(selectedAsset.fileSize)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/50">
                  <span className="text-muted">File Type:</span>
                  <span className="uppercase font-bold">{selectedAsset.fileType || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/50">
                  <span className="text-muted">Dimensions:</span>
                  <span className="font-bold">
                    {selectedAsset.width ? `${selectedAsset.width} × ${selectedAsset.height} px` : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/50">
                  <span className="text-muted">Uploaded:</span>
                  <span className="font-bold">{formatDate(selectedAsset.createdAt)}</span>
                </div>
                <div className="flex justify-between py-1 items-center">
                  <span className="text-muted">Folder:</span>
                  <span className="text-[9px] bg-stone px-2 py-0.5 rounded font-mono text-muted uppercase font-bold">
                    {selectedAsset.folder || 'tnt'}
                  </span>
                </div>
              </div>

              {/* Share URL */}
              <div className="space-y-1.5 border-t border-line pt-4">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Share / Copy Link</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={window.location.origin + selectedAsset.url}
                    className="w-full bg-stone border border-line rounded px-2.5 py-1.5 text-[10px] text-ink font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopyUrl(selectedAsset.url, selectedAsset.id)}
                    className="p-2 border border-line rounded hover:bg-stone text-muted hover:text-ink flex items-center justify-center bg-paper"
                  >
                    {copiedId === selectedAsset.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Actions Section */}
              <div className="space-y-1.5 border-t border-line pt-4">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block font-semibold">Actions</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase">
                  <button
                    onClick={() => handleDownload(selectedAsset)}
                    className="flex items-center justify-center gap-1.5 py-2 border border-line hover:bg-stone rounded text-ink uppercase"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button
                    onClick={() => openRenameModal(selectedAsset)}
                    className="flex items-center justify-center gap-1.5 py-2 border border-line hover:bg-stone rounded text-ink uppercase"
                  >
                    <Edit className="w-3.5 h-3.5" /> Rename
                  </button>
                  <button
                    onClick={() => openMoveModal(selectedAsset)}
                    className="flex items-center justify-center gap-1.5 py-2 border border-line hover:bg-stone rounded text-ink uppercase"
                  >
                    <Folder className="w-3.5 h-3.5" /> Move
                  </button>
                  <button
                    onClick={() => openDeleteModal(selectedAsset)}
                    className="flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600 uppercase"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-paper border border-line rounded-xl p-8 text-center text-xs text-muted shadow-xs">
              Select an asset to view details.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS INTERFACES                                                      */}
      {/* ========================================================================= */}

      {/* Folder Creation / Placeholder selection modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-ink">📁 Create Folder</span>
              <button onClick={() => setShowFolderModal(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1 font-semibold">Folder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. products, cms, banners..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full border border-line rounded px-3 py-1.5 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90 transition-colors"
              >
                Select Folder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && renameAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-ink">✏️ Rename File display</span>
              <button onClick={() => setShowRenameModal(false)} className="text-muted hover:text-ink">
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
                className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Asset Modal */}
      {showMoveModal && moveAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-ink">📂 Move Media Asset</span>
              <button onClick={() => setShowMoveModal(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1 font-semibold">Select Destination Folder</label>
                <select
                  value={targetFolder}
                  onChange={(e) => setTargetFolder(e.target.value)}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="tnt">tnt (default)</option>
                  <option value="products">products</option>
                  <option value="homepage">homepage</option>
                  <option value="banners">banners</option>
                  <option value="collections">collections</option>
                  <option value="aboutus">aboutus</option>
                  <option value="others">others</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleMoveConfirm}
                className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90"
              >
                Move Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Move Modal */}
      {showBulkMoveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-ink">📂 Bulk Move Assets</span>
              <button onClick={() => setShowBulkMoveModal(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1 font-semibold">Select Destination Folder</label>
                <select
                  value={bulkTargetFolder}
                  onChange={(e) => setBulkTargetFolder(e.target.value)}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="tnt">tnt (default)</option>
                  <option value="products">products</option>
                  <option value="homepage">homepage</option>
                  <option value="banners">banners</option>
                  <option value="collections">collections</option>
                  <option value="aboutus">aboutus</option>
                  <option value="others">others</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleBulkMove}
                className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90"
              >
                Move Selected Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Warnings */}
      {showDeleteModal && deleteAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Safety Warning
              </span>
              <button onClick={() => setShowDeleteModal(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {deleteUsages.length > 0 ? (
                <>
                  <p className="text-xs text-ink font-semibold">
                    The file <span className="font-extrabold underline">{deleteAsset.filename}</span> is actively referenced in <span className="text-red-500 font-extrabold">{deleteUsages.length} location(s)</span>:
                  </p>
                  <div className="space-y-1 max-h-36 overflow-y-auto border border-line rounded p-2 bg-stone/20">
                    {deleteUsages.map((u, i) => (
                      <div key={i} className="text-[10px] text-muted py-1 border-b border-line last:border-0 font-medium">
                        • <span className="font-extrabold text-ink">{u.type}</span>: {u.name}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted italic">
                    Deleting this asset will delete it from VPS storage permanently and break the reference in these elements.
                  </p>
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deleteForce}
                      onChange={(e) => setDeleteForce(e.target.checked)}
                      className="rounded border-line focus:ring-0 cursor-pointer w-4 h-4 text-ink"
                    />
                    <span>Force delete and break references</span>
                  </label>
                </>
              ) : (
                <p className="text-xs text-ink font-semibold">
                  Are you sure you want to delete <span className="font-extrabold">{deleteAsset.filename}</span> permanently from VPS storage?
                </p>
              )}

              <div className="flex gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 bg-stone border border-line rounded text-ink text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteUsages.length > 0 && !deleteForce}
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 bg-red-600 text-paper rounded text-xs font-bold uppercase hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
