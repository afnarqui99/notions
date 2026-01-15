import { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  Plus, 
  Minus, 
  File, 
  Check, 
  X, 
  RefreshCw,
  GitCommit,
  ChevronRight,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import gitService from '../services/GitService';

export default function GitPanel({ projectPath, onFileSelect }) {
  const [gitInfo, setGitInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    changes: true,
    staged: true,
    untracked: true
  });
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitInput, setShowCommitInput] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Cargar información de git
  const loadGitInfo = async () => {
    if (!projectPath) {
      setGitInfo(null);
      return;
    }

    setLoading(true);
    try {
      const info = await gitService.getRepositoryInfo(projectPath);
      setGitInfo(info);
    } catch (error) {
      console.error('[GitPanel] Error cargando info de git:', error);
      setGitInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Cargar información inicial y refrescar periódicamente
  useEffect(() => {
    loadGitInfo();

    // Refrescar cada 3 segundos
    refreshIntervalRef.current = setInterval(loadGitInfo, 3000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [projectPath]);

  // Ya no cargamos el diff aquí, se maneja en GitDiffView
  // useEffect para cargar diff eliminado - ahora se usa GitDiffView

  const handleStageFile = async (filePath) => {
    if (!projectPath) return;
    
    const success = await gitService.addFile(projectPath, filePath);
    if (success) {
      await loadGitInfo();
    }
  };

  const handleUnstageFile = async (filePath) => {
    if (!projectPath) return;
    
    const success = await gitService.unstageFile(projectPath, filePath);
    if (success) {
      await loadGitInfo();
    }
  };

  const handleCommit = async () => {
    if (!projectPath || !commitMessage.trim()) return;

    const success = await gitService.commit(projectPath, commitMessage.trim());
    if (success) {
      setCommitMessage('');
      setShowCommitInput(false);
      await loadGitInfo();
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!projectPath) {
    return (
      <div className="h-full flex items-center justify-center text-[#858585] text-[12px] p-4 text-center">
        <div>
          <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Selecciona un proyecto para ver información de Git</p>
        </div>
      </div>
    );
  }

  if (loading && !gitInfo) {
    return (
      <div className="h-full flex items-center justify-center text-[#858585] text-[12px]">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Cargando información de Git...
      </div>
    );
  }

  if (!gitInfo || !gitInfo.isRepository) {
    return (
      <div className="h-full flex items-center justify-center text-[#858585] text-[12px] p-4 text-center">
        <div>
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Este directorio no es un repositorio Git</p>
        </div>
      </div>
    );
  }

  const { branch, status } = gitInfo;
  const hasChanges = status && (
    status.modified.length > 0 ||
    status.added.length > 0 ||
    status.deleted.length > 0 ||
    status.untracked.length > 0 ||
    status.staged.length > 0
  );

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#cccccc] text-[12px] overflow-hidden">
      {/* Header con rama */}
      <div className="px-3 py-2 border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[#4ec9b0]" />
          <span className="font-semibold text-[#cccccc]">{branch || 'Sin rama'}</span>
        </div>
        <button
          onClick={loadGitInfo}
          className="p-1 hover:bg-[#2d2d30] rounded transition-colors"
          title="Refrescar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {!hasChanges ? (
          <div className="p-4 text-center text-[#858585]">
            <Check className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-[11px]">No hay cambios</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Archivos en Stage */}
            {status.staged.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('staged')}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2d2d30] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.staged ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span className="text-[11px] font-semibold text-[#4ec9b0]">
                      STAGED CHANGES ({status.staged.length})
                    </span>
                  </div>
                </button>
                {expandedSections.staged && (
                  <div className="space-y-0.5">
                    {status.staged.map((file, index) => (
                      <div
                        key={index}
                        className="px-6 py-1.5 hover:bg-[#2d2d30] flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File className="w-3 h-3 text-[#4ec9b0] flex-shrink-0" />
                          <span
                            className="text-[11px] truncate cursor-pointer"
                            onClick={() => {
                              // Llamar directamente a onFileSelect para abrir GitDiffView
                              if (onFileSelect) {
                                onFileSelect(file);
                              }
                            }}
                            title={file}
                          >
                            {file}
                          </span>
                        </div>
                        <button
                          onClick={() => handleUnstageFile(file)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#3e3e42] rounded transition-all"
                          title="Unstage"
                        >
                          <Minus className="w-3 h-3 text-[#f48771]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cambios sin Stage */}
            {status.unstaged.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('changes')}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2d2d30] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.changes ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span className="text-[11px] font-semibold text-[#f48771]">
                      CHANGES ({status.unstaged.length})
                    </span>
                  </div>
                </button>
                {expandedSections.changes && (
                  <div className="space-y-0.5">
                    {status.unstaged.map((file, index) => (
                      <div
                        key={index}
                        className="px-6 py-1.5 hover:bg-[#2d2d30] flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File className="w-3 h-3 text-[#f48771] flex-shrink-0" />
                          <span
                            className="text-[11px] truncate cursor-pointer"
                            onClick={() => {
                              // Llamar directamente a onFileSelect para abrir GitDiffView
                              if (onFileSelect) {
                                onFileSelect(file);
                              }
                            }}
                            title={file}
                          >
                            {file}
                          </span>
                        </div>
                        <button
                          onClick={() => handleStageFile(file)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#3e3e42] rounded transition-all"
                          title="Stage"
                        >
                          <Plus className="w-3 h-3 text-[#4ec9b0]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Archivos eliminados */}
            {status.deleted.length > 0 && (
              <div className="px-3 py-1.5">
                <span className="text-[11px] font-semibold text-[#f48771]">
                  DELETED ({status.deleted.length})
                </span>
                <div className="space-y-0.5 mt-1">
                  {status.deleted.map((file, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 text-[11px] text-[#858585] flex items-center gap-2"
                    >
                      <Minus className="w-3 h-3 text-[#f48771]" />
                      <span className="truncate">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Archivos sin trackear */}
            {status.untracked.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('untracked')}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2d2d30] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.untracked ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span className="text-[11px] font-semibold text-[#858585]">
                      UNTRACKED ({status.untracked.length})
                    </span>
                  </div>
                </button>
                {expandedSections.untracked && (
                  <div className="space-y-0.5">
                    {status.untracked.map((file, index) => (
                      <div
                        key={index}
                        className="px-6 py-1.5 hover:bg-[#2d2d30] flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File className="w-3 h-3 text-[#858585] flex-shrink-0" />
                          <span
                            className="text-[11px] truncate cursor-pointer"
                            onClick={() => {
                              // Llamar directamente a onFileSelect para abrir GitDiffView
                              if (onFileSelect) {
                                onFileSelect(file);
                              }
                            }}
                            title={file}
                          >
                            {file}
                          </span>
                        </div>
                        <button
                          onClick={() => handleStageFile(file)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#3e3e42] rounded transition-all"
                          title="Add to stage"
                        >
                          <Plus className="w-3 h-3 text-[#4ec9b0]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      {hasChanges && (
        <div className="border-t border-[#3e3e42] bg-[#252526] p-2 space-y-2">
          {showCommitInput ? (
            <div className="space-y-2">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Mensaje de commit..."
                className="w-full px-2 py-1.5 text-[11px] bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCommit();
                  } else if (e.key === 'Escape') {
                    setShowCommitInput(false);
                    setCommitMessage('');
                  }
                }}
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  onClick={handleCommit}
                  disabled={!commitMessage.trim()}
                  className="flex-1 px-2 py-1 bg-[#007acc] hover:bg-[#005a9e] text-white rounded text-[11px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <GitCommit className="w-3 h-3" />
                  Commit
                </button>
                <button
                  onClick={() => {
                    setShowCommitInput(false);
                    setCommitMessage('');
                  }}
                  className="px-2 py-1 bg-[#3e3e42] hover:bg-[#4e4e52] text-[#cccccc] rounded text-[11px] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCommitInput(true)}
              disabled={status.staged.length === 0}
              className="w-full px-2 py-1.5 bg-[#007acc] hover:bg-[#005a9e] text-white rounded text-[11px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <GitCommit className="w-3 h-3" />
              {status.staged.length > 0 ? `Commit (${status.staged.length} staged)` : 'No hay archivos staged'}
            </button>
          )}
        </div>
      )}

      {/* Panel de diff eliminado - ahora se usa GitDiffView en el editor principal */}
    </div>
  );
}

