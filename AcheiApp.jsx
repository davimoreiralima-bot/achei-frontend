import React, { useState, useEffect } from 'react';
import { Search, PackageCheck, MailCheck, KeyRound, CheckCircle2, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const AcheiApp = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // URL oficial do seu Backend no Render
  const BACKEND_URL = "https://achei-backend.onrender.com";
  const navyClass = "bg-[#10345c]";

  // ==========================================
  // 1. BUSCAR ITENS DO BANCO DE DADOS (API)
  // ==========================================
  const fetchItems = async () => {
    try {
      // Constrói a URL com os filtros de busca e categoria
      const response = await fetch(`${BACKEND_URL}/api/items?category=${category}&search=${search}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        toast.error("Erro ao carregar os itens do estoque.");
      }
    } catch (err) {
      console.error("Erro de conexão:", err);
    }
  };

  // Dispara a busca sempre que o usuário mudar a categoria ou digitar na busca
  useEffect(() => {
    fetchItems();
  }, [category, search]);


  // ==========================================
  // 2. SOLICITAR TOKEN (Regra dos 15 minutos)
  // ==========================================
  const handleRequestToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const data = {
      itemId: selectedItem.id,
      requerenteName: formData.get('name'),
      email: formData.get('email'),
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/returns/request-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      
      if (res.ok) {
        toast.success(result.message);
        setIsTokenModalOpen(false); // Fecha o modal de dados do requerente
      } else {
        // Exibe o erro caso o token anterior ainda esteja válido (dentro dos 15 min)
        toast.error(result.error || "Erro ao gerar token.");
      }
    } catch (err) {
      toast.error("Erro na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. VALIDAR TOKEN E CONCLUIR ENTREGA
  // ==========================================
  const handleValidateToken = async () => {
    if (!tokenInput || tokenInput.length !== 6) {
      toast.error("Por favor, insira o token de 6 dígitos.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/returns/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput })
      });
      const result = await res.json();
      
      if (res.ok) {
        setShowSuccessModal(true);
        setTokenInput('');
        fetchItems(); // Atualiza a lista para sumir com o item entregue
      } else {
        toast.error(result.error || "Token inválido ou expirado.");
      }
    } catch (err) {
      toast.error("Erro ao validar o token.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <Toaster position="top-right" />
      
      {/* Header Estilizado conforme Layout Canva */}
      <header className="border-b border-[#dfe7ee] bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${navyClass} w-10 h-10 rounded-xl text-white flex items-center justify-center`}>
              <Search size={20} />
            </div>
            <h1 className="text-xl font-bold text-[#10345c]">ACHEI!!</h1>
          </div>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border">
            Painel do Funcionário
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Seção de Título e Feedback Visual */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#10345c]">Encontre o que você perdeu</h2>
          <p className="text-gray-500 mt-1">Veja os objetos disponíveis no balcão e filtre rapidamente por categoria.</p>
        </div>

        {/* Barra de Busca e Filtros de Categoria */}
        <section className="bg-white rounded-[22px] border p-4 shadow-sm mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3 text-gray-400" size={20} />
            <input 
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder="Buscar por título, categoria ou local..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {/* Botões de Categorias Dinâmicas */}
          <div className="flex flex-wrap gap-2 pt-1">
            {['Todos', 'Eletrônicos', 'Documentos', 'Livros', 'Vestuário', 'Outros'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  category === cat 
                    ? 'bg-[#10345c] text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Grid de Itens vindos do PostgreSQL */}
        {items.length === 0 ? (
          <div className="bg-white rounded-[22px] border p-12 text-center text-gray-500 shadow-sm">
            <PackageCheck size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-lg text-[#10345c]">Nenhum item encontrado</p>
            <p className="text-sm mt-1">Tente ajustar sua busca ou selecionar outra categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-[22px] border border-[#e1e9ef] overflow-hidden hover:shadow-lg transition flex flex-col justify-between">
                <div>
                  <div className="h-40 bg-gray-50 border-b flex items-center justify-center text-gray-400 relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <KeyRound size={40} className="text-gray-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-[#18324a] mt-2.5 text-lg line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <button 
                    onClick={() => { setSelectedItem(item); setIsTokenModalOpen(true); }}
                    className={`w-full py-2.5 ${navyClass} text-white rounded-xl font-semibold hover:opacity-95 transition shadow-sm`}
                  >
                    Solicitar Devolução
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEÇÃO DE VALIDAÇÃO FIXA (CONFIRMAR ENTREGA) */}
        <section className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-[24px] border border-[#e2eaf0] shadow-md text-center">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4 mx-auto border border-green-100">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-xl font-bold text-[#10345c]">Balcão de Atendimento: Validar Código</h3>
          <p className="text-gray-500 text-sm mt-1">Insira o código de 6 dígitos enviado ao e-mail do requerente para concluir a entrega do item solicitado.</p>
          <div className="mt-6 max-w-sm mx-auto">
            <input 
              maxLength="6"
              className="w-full text-center text-3xl font-bold tracking-[0.3em] p-3.5 border-2 rounded-xl focus:border-[#10345c] outline-none bg-gray-50/50 transition"
              placeholder="000000"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))} // Apenas números
            />
            <button 
              onClick={handleValidateToken}
              className={`w-full mt-4 py-3 ${navyClass} text-white rounded-xl font-bold transition shadow-md hover:opacity-95`}
            >
              Validar Token e Concluir
            </button>
          </div>
        </section>
      </main>

      {/* MODAL DE SOLICITAÇÃO (DADOS DO REQUERENTE) */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-2xl border">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#10345c]">Dados para Devolução</h2>
                <p className="text-xs text-gray-400 mt-0.5">Item: {selectedItem?.title}</p>
              </div>
              <button onClick={() => setIsTokenModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nome do Requerente</label>
                <input name="name" placeholder="Ex: Davi Moreira" className="w-full p-3 border rounded-xl outline-none focus:border-blue-300" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">E-mail do Requerente</label>
                <input name="email" type="email" placeholder="Ex: davi@email.com" className="w-full p-3 border rounded-xl outline-none focus:border-blue-300" required />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-3.5 ${navyClass} text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50`}
              >
                <MailCheck size={18} /> {loading ? "Gerando Código..." : "Gerar e Enviar Token"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO (DELIVERY SUCCESS MODAL) */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full text-center shadow-2xl border animate-scale-up">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
              <PackageCheck size={32} />
            </div>
            <h3 className="text-2xl font-bold text-[#10345c]">Entrega Concluída!</h3>
            <p className="text-gray-500 text-sm mt-2">O token foi validado com sucesso. O item foi removido do estoque público do balcão.</p>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className={`w-full mt-5 py-3 ${navyClass} text-white rounded-xl font-bold shadow-md hover:opacity-95`}
            >
              Fechar e Voltar ao Feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcheiApp;
