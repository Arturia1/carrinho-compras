import { useEffect, useState } from 'react';
import axios from 'axios';

interface Produto { id: number; descricaoProduto: string; precoLiquido: string; quantidadeEstoque: number; }
interface CartItem { id: number; produtoId: number; quantidade: number; precoTotalItem: number; produto: Produto; }
interface Carrinho { id: number; status: string; itens: CartItem[]; cupom: { codigoCupom: string } | null; resumo: { subtotal: string; desconto: string; total: string; }; }

const api = axios.create({ baseURL: 'http://127.0.0.1:3000' });

export default function App() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  
  const [cartId, setCartId] = useState<number | null>(null);

  // Quebrador de cache para garantir a sessão correta
  useEffect(() => {
    const inicializarSessao = async () => {
      try {
        const res = await api.get(`/sessao/carrinho-ativo?t=${new Date().getTime()}`);
        setCartId(res.data.cartId);
      } catch (error) {
        console.error("Erro ao buscar sessão ativa", error);
        setCartId(1);
      }
    };
    inicializarSessao();
  }, []);

  useEffect(() => {
    if (cartId === null) return;

    const carregarDados = async () => {
      try {
        const resProd = await api.get('/produtos');
        setProdutos(resProd.data);
        const resCart = await api.get(`/carrinho/${cartId}`); 
        setCarrinho(resCart.data);
      } catch (error) {
        console.error("Erro ao buscar dados da API", error);
      }
    };
    carregarDados();
  }, [cartId]);

  const adicionarAoCarrinho = async (produtoId: number) => {
    try {
      const res = await api.post(`/carrinho/${cartId}/item`, { produtoId, quantidade: 1 });
      setCarrinho(res.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao adicionar item');
    }
  };

  const alterarQuantidade = async (produtoId: number, quantidade: number) => {
    try {
      const res = await api.put(`/carrinho/${cartId}/item`, { produtoId, quantidade });
      setCarrinho(res.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao alterar quantidade');
    }
  };

  const removerItem = async (produtoId: number) => {
    try {
      const res = await api.delete(`/carrinho/${cartId}/item/${produtoId}`);
      setCarrinho(res.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao remover item');
    }
  };

  const aplicarCupom = async () => {
    const codigo = prompt('Insira o código do cupom (ex: 10OFF ou 15OFF):');
    if (!codigo) return;
    try {
      const res = await api.post(`/carrinho/${cartId}/cupom`, { codigoCupom: codigo.toUpperCase() });
      setCarrinho(res.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Cupom inválido');
    }
  };

  const removerCupom = async () => {
    try {
      const res = await api.delete(`/carrinho/${cartId}/cupom`);
      setCarrinho(res.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao remover cupom');
    }
  };

  const finalizarCompra = async () => {
    try {
      const res = await api.post(`/carrinho/${cartId}/checkout`);
      alert(res.data.message);
      const resCart = await api.get(`/carrinho/${cartId}`);
      setCarrinho(resCart.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao finalizar compra');
    }
  };

  const iniciarNovoCarrinho = async () => {
    try {
      const res = await api.get(`/sessao/carrinho-ativo?t=${new Date().getTime()}`);
      setCartId(res.data.cartId);
    } catch (error) {
      if (cartId !== null) setCartId(cartId + 1);
    }
  };

  if (cartId === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9', color: '#3b82f6', fontSize: '1.5rem', fontWeight: 'bold' }}>
        ⚡ Conectando ao TechMarket...
      </div>
    );
  }

  const isFinalizado = carrinho?.status === 'FINALIZADO';
  const totalItens = carrinho?.itens.reduce((acc, item) => acc + item.quantidade, 0) || 0;

  return (
    <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#333' }}>
      
      <header style={{ backgroundColor: '#1e293b', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#3b82f6' }}>⚡</span> TechMarket
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Carrinho #{cartId} {isFinalizado && '(Finalizado)'}</span>
          <div style={{ backgroundColor: '#3b82f6', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
            🛒 {totalItens} itens
          </div>
        </div>
      </header>

      <main style={{ display: 'flex', gap: '2rem', padding: '2rem', maxWidth: '1400px', margin: '0 auto', flexDirection: 'row', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1 1 60%' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Destaques em Hardware</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {produtos.map(p => (
              <div key={p.id} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ height: '120px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '2rem' }}>📦</div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#0f172a' }}>{p.descricaoProduto}</h3>
                  <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#64748b' }}>Disponível: {p.quantidadeEstoque} un.</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 15px 0', fontSize: '1.5rem', fontWeight: '800', color: '#16a34a' }}>R$ {Number(p.precoLiquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <button onClick={() => adicionarAoCarrinho(p.id)} style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Adicionar ao Carrinho</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside style={{ flex: '1 1 35%', minWidth: '300px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'sticky', top: '100px', border: '1px solid #e2e8f0' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>Seu Pedido</h2>
              {isFinalizado && <button onClick={iniciarNovoCarrinho} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Novo Carrinho</button>}
            </div>
            
            {!carrinho || carrinho?.itens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🛒</span>
                Seu carrinho está vazio.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                {carrinho.itens.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>{item.produto.descricaoProduto}</span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                          <button onClick={() => alterarQuantidade(item.produtoId, item.quantidade - 1)} style={{ padding: '4px 10px', border: 'none', backgroundColor: '#f8fafc', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>-</button>
                          
                          <input 
                            type="number" 
                            value={item.quantidade}
                            min="1"
                            onChange={(e) => {
                              const novaQtd = parseInt(e.target.value);
                              if (novaQtd > 0) alterarQuantidade(item.produtoId, novaQtd);
                            }}
                            style={{ width: '40px', border: 'none', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }}
                          />

                          <button onClick={() => alterarQuantidade(item.produtoId, item.quantidade + 1)} style={{ padding: '4px 10px', border: 'none', backgroundColor: '#f8fafc', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>+</button>
                        </div>
                        <button onClick={() => removerItem(item.produtoId)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>Remover</button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', textAlign: 'right', minWidth: '80px' }}>
                      R$ {Number(item.precoTotalItem).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: '2rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                <span>Subtotal:</span>
                <span>R$ {Number(carrinho?.resumo.subtotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#10b981', fontWeight: '600' }}>
                <span>Desconto {carrinho?.cupom && `(${carrinho.cupom.codigoCupom})`}:</span>
                <span>- R$ {Number(carrinho?.resumo.desconto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '2px dashed #cbd5e1', fontSize: '1.4rem', fontWeight: '900', color: '#0f172a' }}>
                <span>Total:</span>
                <span>R$ {Number(carrinho?.resumo.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {carrinho?.cupom ? (
                <button onClick={removerCupom} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Remover Cupom ({carrinho.cupom.codigoCupom})</button>
              ) : (
                <button onClick={aplicarCupom} disabled={!carrinho || carrinho.itens.length === 0} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>🛒 Inserir Cupom de Desconto</button>
              )}
              
              <button 
                onClick={finalizarCompra} 
                disabled={!carrinho || carrinho.itens.length === 0} 
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}
              >
                Finalizar Compra
              </button>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}