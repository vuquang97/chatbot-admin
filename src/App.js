import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Save, X, Plus, Database, MessageSquare, TrendingUp } from 'lucide-react';

const AdminPanel = () => {
  const [trainingData, setTrainingData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [stats, setStats] = useState({ total: 0, recent: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const API_URL = 'https://ai-chatbot-f73a.onrender.com';

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Ping server mỗi 5 phút để tránh sleep
  useEffect(() => {
    const keepAlive = setInterval(async () => {
      try {
        await fetch(`${API_URL}/api/status`);
        console.log('✅ Keep-alive ping sent');
      } catch (error) {
        console.log('⚠️ Keep-alive failed');
      }
    }, 5 * 60 * 1000); // 5 phút

    return () => clearInterval(keepAlive);
  }, [API_URL]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/admin/data`);
        if (response.ok) {
          const data = await response.json();
          setTrainingData(data.training_data || []);
          updateStats(data.training_data || []);
        }
      } catch (error) {
        console.error('Lỗi load data:', error);
        showNotification('❌ Không thể kết nối tới server', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDataAgain = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/data`);
      if (response.ok) {
        const data = await response.json();
        setTrainingData(data.training_data || []);
        updateStats(data.training_data || []);
      }
    } catch (error) {
      console.error('Lỗi load data:', error);
    }
  };

  const updateStats = (data) => {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const recent = data.filter(item => new Date(item.timestamp) > oneDayAgo).length;
    setStats({ total: data.length, recent });
  };

  // Thêm mới
  const handleAdd = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      showNotification('⚠️ Vui lòng nhập đầy đủ câu hỏi và câu trả lời!', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer })
      });

      if (response.ok) {
        // ✅ Thêm vào state ngay lập tức (optimistic update)
        const newItem = {
          id: trainingData.length + 1,
          question: newQuestion,
          answer: newAnswer,
          timestamp: new Date().toISOString()
        };
        setTrainingData([...trainingData, newItem]);
        updateStats([...trainingData, newItem]);
        
        showNotification('✅ Đã thêm thành công!', 'success');
        setNewQuestion('');
        setNewAnswer('');
        
        // Load lại để đồng bộ với server
        setTimeout(() => loadDataAgain(), 500);
      } else {
        showNotification('❌ Lỗi khi thêm dữ liệu', 'error');
      }
    } catch (error) {
      showNotification('❌ Không thể kết nối tới server', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sửa
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
  };

  const handleUpdate = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: editQuestion, answer: editAnswer })
      });

      if (response.ok) {
        // ✅ Cập nhật state ngay lập tức
        const updated = trainingData.map(item =>
          item.id === id ? { ...item, question: editQuestion, answer: editAnswer } : item
        );
        setTrainingData(updated);
        setEditingId(null);
        
        showNotification('✅ Đã cập nhật!', 'success');
        
        // Load lại để đồng bộ với server
        setTimeout(() => loadDataAgain(), 500);
      } else {
        showNotification('❌ Lỗi khi cập nhật', 'error');
      }
    } catch (error) {
      showNotification('❌ Không thể kết nối tới server', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Xóa
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mục này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/delete/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // ✅ Xóa khỏi state ngay lập tức
        const filtered = trainingData.filter(item => item.id !== id);
        setTrainingData(filtered);
        updateStats(filtered);
        
        showNotification('✅ Đã xóa!', 'success');
        
        // Load lại để đồng bộ với server
        setTimeout(() => loadDataAgain(), 500);
      } else {
        showNotification('❌ Lỗi khi xóa', 'error');
      }
    } catch (error) {
      showNotification('❌ Không thể kết nối tới server', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredData = trainingData.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Bulk Add từ text
  const handleBulkAdd = async () => {
    if (!bulkText.trim()) {
      showNotification('⚠️ Vui lòng nhập dữ liệu!', 'error');
      return;
    }

    const lines = bulkText.trim().split('\n');
    const pairs = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      const question = lines[i]?.trim();
      const answer = lines[i + 1]?.trim();
      
      if (question && answer) {
        pairs.push({ question, answer });
      }
    }

    if (pairs.length === 0) {
      showNotification('❌ Không tìm thấy cặp Q&A hợp lệ!\n\nFormat:\nCâu hỏi 1\nCâu trả lời 1\nCâu hỏi 2\nCâu trả lời 2', 'error');
      return;
    }

    setLoading(true);
    let successCount = 0;

    for (const pair of pairs) {
      try {
        const response = await fetch(`${API_URL}/train`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pair)
        });

        if (response.ok) {
          successCount++;
        }
      } catch (error) {
        console.error('Lỗi khi thêm:', error);
      }
    }

    setLoading(false);
    setBulkText('');
    setShowBulkAdd(false);
    showNotification(`✅ Đã thêm ${successCount}/${pairs.length} cặp Q&A`, 'success');
    await loadDataAgain();
  };

  // ✅ Import từ file JSON/CSV
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        let pairs = [];

        if (file.name.endsWith('.json')) {
          // JSON format: [{"question": "...", "answer": "..."}, ...]
          pairs = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          // CSV format: question,answer
          const lines = text.split('\n');
          for (let i = 1; i < lines.length; i++) {
            const [question, answer] = lines[i].split(',').map(s => s.trim());
            if (question && answer) {
              pairs.push({ question, answer });
            }
          }
        }

        if (pairs.length === 0) {
          showNotification('❌ File không đúng format!', 'error');
          return;
        }

        setLoading(true);
        let successCount = 0;

        for (const pair of pairs) {
          try {
            const response = await fetch(`${API_URL}/train`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pair)
            });

            if (response.ok) successCount++;
          } catch (error) {
            console.error('Lỗi:', error);
          }
        }

        setLoading(false);
        showNotification(`✅ Đã import ${successCount}/${pairs.length} cặp Q&A`, 'success');
        await loadDataAgain();
      } catch (error) {
        showNotification('❌ Lỗi khi đọc file: ' + error.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold`}>
          {notification.message}
        </div>
      )}

      {loading && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          ⏳ Đang xử lý...
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">🤖 AI Chatbot Admin</h1>
              <p className="text-gray-600">Quản lý Training Data</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowBulkAdd(!showBulkAdd)}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                <Plus size={20} />
                Thêm hàng loạt
              </button>
              
              <label className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition flex items-center gap-2 font-semibold cursor-pointer">
                <Database size={20} />
                Import File
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileImport}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                <Plus size={20} />
                Thêm mới
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Tổng câu hỏi</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Database size={40} className="opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Thêm 24h qua</p>
                  <p className="text-3xl font-bold">{stats.recent}</p>
                </div>
                <TrendingUp size={40} className="opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">API Status</p>
                  <p className="text-3xl font-bold">✅ Online</p>
                </div>
                <MessageSquare size={40} className="opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">➕ Thêm Training Data Mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Câu hỏi:</label>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && document.querySelector('textarea').focus()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="Nhập câu hỏi..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Câu trả lời:</label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  rows="3"
                  placeholder="Nhập câu trả lời..."
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleAdd}
                  disabled={loading}
                  className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition flex items-center gap-2 font-semibold disabled:opacity-50"
                >
                  <Save size={18} />
                  Lưu & Tiếp tục
                </button>
                <button
                  onClick={() => {
                    handleAdd();
                    setTimeout(() => setShowAddForm(false), 1000);
                  }}
                  disabled={loading}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition flex items-center gap-2 font-semibold disabled:opacity-50"
                >
                  <Save size={18} />
                  Lưu & Đóng
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition flex items-center gap-2 font-semibold disabled:opacity-50"
                >
                  <X size={18} />
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Add Form */}
        {showBulkAdd && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Thêm Training Data Hàng Loạt</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Format:</strong> Mỗi câu hỏi và câu trả lời trên 1 dòng riêng<br/>
                Câu hỏi 1<br/>
                Câu trả lời 1<br/>
                Câu hỏi 2<br/>
                Câu trả lời 2
              </p>
            </div>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none font-mono text-sm"
              rows="10"
              placeholder="Bạn tên gì&#10;Tôi là AI Chatbot&#10;Bạn làm gì&#10;Tôi trả lời câu hỏi"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleBulkAdd}
                disabled={loading}
                className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                <Save size={18} />
                Import ({bulkText.split('\n').filter(l => l.trim()).length / 2} cặp)
              </button>
              <button
                onClick={() => setShowBulkAdd(false)}
                disabled={loading}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                <X size={18} />
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            placeholder="🔍 Tìm kiếm câu hỏi hoặc câu trả lời..."
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">#</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Câu hỏi</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Câu trả lời</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Thời gian</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-600 font-semibold">{index + 1}</td>
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editQuestion}
                          onChange={(e) => setEditQuestion(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none"
                        />
                      ) : (
                        <p className="text-gray-800 font-medium">{item.question}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <textarea
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none"
                          rows="2"
                        />
                      ) : (
                        <p className="text-gray-600">{item.answer}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(item.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {editingId === item.id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(item.id)}
                              disabled={loading}
                              className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                              title="Lưu"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={loading}
                              className="bg-gray-400 text-white p-2 rounded-lg hover:bg-gray-500 transition disabled:opacity-50"
                              title="Hủy"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              disabled={loading}
                              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                              title="Sửa"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={loading}
                              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl">Không tìm thấy dữ liệu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;