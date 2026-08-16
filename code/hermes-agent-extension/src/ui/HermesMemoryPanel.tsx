// ============================================
// HermesMemoryPanel - Memory System UI
// ============================================

import React, { useState, useEffect } from 'react';
import { MemoryData, GraphStats } from '../types';

interface HermesMemoryPanelProps {
  memory: MemoryData | null;
  graphStats: GraphStats | null;
  onAddMemory: (content: string, target: 'memory' | 'user') => Promise<void>;
  onSearchMemory: (query: string) => Promise<any[]>;
  onQueryGraph: (question: string) => Promise<any>;
  onRefresh: () => Promise<void>;
}

export const HermesMemoryPanel: React.FC<HermesMemoryPanelProps> = ({
  memory,
  graphStats,
  onAddMemory,
  onSearchMemory,
  onQueryGraph,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'graph' | 'search'>('memory');
  const [newEntry, setNewEntry] = useState('');
  const [entryTarget, setEntryTarget] = useState<'memory' | 'user'>('memory');
  const [searchQuery, setSearchQuery] = useState('');
  const [graphQuestion, setGraphQuestion] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [graphResult, setGraphResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAddEntry = async () => {
    if (!newEntry.trim()) return;
    setLoading(true);
    try {
      await onAddMemory(newEntry, entryTarget);
      setNewEntry('');
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const results = await onSearchMemory(searchQuery);
      setSearchResults(results);
    } finally {
      setLoading(false);
    }
  };

  const handleGraphQuery = async () => {
    if (!graphQuestion.trim()) return;
    setLoading(true);
    try {
      const result = await onQueryGraph(graphQuestion);
      setGraphResult(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hermes-memory-panel">
      <h3>Hermes Memory</h3>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'memory' ? 'active' : ''}
          onClick={() => setActiveTab('memory')}
        >
          Memory
        </button>
        <button
          className={activeTab === 'graph' ? 'active' : ''}
          onClick={() => setActiveTab('graph')}
        >
          Knowledge Graph
        </button>
        <button
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
      </div>

      {/* Memory Tab */}
      {activeTab === 'memory' && (
        <div className="memory-tab">
          <div className="memory-content">
            <h4>MEMORY.md</h4>
            <pre className="memory-text">
              {memory?.memory || 'No memory entries'}
            </pre>
          </div>

          <div className="memory-content">
            <h4>USER.md</h4>
            <pre className="memory-text">
              {memory?.user || 'No user profile'}
            </pre>
          </div>

          <div className="add-entry">
            <h4>Add Entry</h4>
            <select
              value={entryTarget}
              onChange={(e) => setEntryTarget(e.target.value as any)}
            >
              <option value="memory">Memory (agent notes)</option>
              <option value="user">User (profile)</option>
            </select>
            <textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="Enter memory content..."
              rows={3}
            />
            <button onClick={handleAddEntry} disabled={loading}>
              {loading ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </div>
      )}

      {/* Knowledge Graph Tab */}
      {activeTab === 'graph' && (
        <div className="graph-tab">
          <div className="graph-stats">
            <div className="stat">
              <span className="stat-value">{graphStats?.nodes || 0}</span>
              <span className="stat-label">Nodes</span>
            </div>
            <div className="stat">
              <span className="stat-value">{graphStats?.edges || 0}</span>
              <span className="stat-label">Edges</span>
            </div>
            <div className="stat">
              <span className="stat-value">{graphStats?.communities || 0}</span>
              <span className="stat-label">Communities</span>
            </div>
          </div>

          <div className="graph-query">
            <h4>Query Knowledge Graph</h4>
            <input
              type="text"
              value={graphQuestion}
              onChange={(e) => setGraphQuestion(e.target.value)}
              placeholder="Ask a question..."
              onKeyDown={(e) => e.key === 'Enter' && handleGraphQuery()}
            />
            <button onClick={handleGraphQuery} disabled={loading}>
              {loading ? 'Querying...' : 'Query'}
            </button>
          </div>

          {graphResult && (
            <div className="graph-result">
              <h4>Result</h4>
              <pre>{JSON.stringify(graphResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="search-tab">
          <div className="search-input">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="search-results">
            {searchResults.length === 0 ? (
              <div className="empty-state">No results</div>
            ) : (
              searchResults.map((result, i) => (
                <div key={i} className="search-result-item">
                  <div className="result-title">{result.title}</div>
                  <div className="result-snippet">{result.snippet}</div>
                  <div className="result-meta">
                    {result.session_id} • {result.when}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
