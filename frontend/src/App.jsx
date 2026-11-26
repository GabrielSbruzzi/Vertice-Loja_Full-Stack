import React, { createContext, useContext, useEffect, useState } from 'react';

import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';

import { Activity, Boxes, ChartNoAxesCombined, ChevronDown, CircleHelp, LayoutDashboard, LogOut, Menu, Package, Plus, Search, ShoppingBag, ShoppingCart, Users, X } from 'lucide-react';

import { api } from './services/api';


const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);


function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('loja_user'));
 }
    catch { return null;
 }
  });

  const [stores, setStores] = useState([]);

  const [storesLoaded, setStoresLoaded] = useState(false);

  const [activeStoreId, setActiveStoreId] = useState(localStorage.getItem('loja_store_id') || '');


  async function refreshStores() {
    setStoresLoaded(false);

    const result = await api('/stores');

    setStores(result);

    const savedStore = result.find((store) => String(store.id) === String(localStorage.getItem('loja_store_id')));

    const selectedStore = savedStore || result[0];

    if (selectedStore) {
      localStorage.setItem('loja_store_id', String(selectedStore.id));

      setActiveStoreId(String(selectedStore.id));

    }
    setStoresLoaded(true);

    return result;

  }

  const login = async (email, password) => {
    const result = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    localStorage.setItem('loja_token', result.token);

    localStorage.setItem('loja_user', JSON.stringify(result.user));

    setUser(result.user);

    await refreshStores();

  };


  const logout = () => {
    localStorage.removeItem('loja_token');

    localStorage.removeItem('loja_user');

    localStorage.removeItem('loja_store_id');

    setUser(null);

    setStores([]);

    setActiveStoreId('');

    setStoresLoaded(false);

  };


  async function createStore(name) {
    const created = await api('/stores', {
      method: 'POST',
      body: JSON.stringify({ name })
    });

    const updatedStores = [...stores, created];

    setStores(updatedStores);

    selectStore(created.id);

  }

  async function updateStore(id, name) {
    const updated = await api(`/stores/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
    setStores(current => current.map(store => String(store.id) === String(id) ? updated : store));
    return updated;
  }

  async function deleteStore(id) {
    await api(`/stores/${id}`, { method: 'DELETE' });
    const updatedStores = stores.filter(store => String(store.id) !== String(id));
    setStores(updatedStores);
    if (String(activeStoreId) === String(id)) {
      if (updatedStores.length) selectStore(updatedStores[0].id);
      else { localStorage.removeItem('loja_store_id'); setActiveStoreId(''); window.location.reload(); }
    }
  }

  function selectStore(id) {
    localStorage.setItem('loja_store_id', String(id));
    setActiveStoreId(String(id));
    window.location.reload();
  }

  useEffect(() => {
    if (user && localStorage.getItem('loja_token')) {
      refreshStores().catch(() => logout());

    }
  }, []);


  return (
    <AuthContext.Provider value={{ user, login, logout, stores, storesLoaded, activeStoreId, selectStore, createStore, updateStore, deleteStore }}>
      {children}
    </AuthContext.Provider>
  );

}

function Protected({ children }) {
  const { user, storesLoaded } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!storesLoaded) return <div className="empty">Carregando suas lojas...</div>;

  return children;

}
function Login() {
  const { login } = useAuth();
 const navigate = useNavigate();

  const [email,setEmail] = useState('admin@loja.com');
 const [password,setPassword] = useState('123456');
 const [error,setError] = useState('');
 const [busy,setBusy] = useState(false);

  async function submit(e) { e.preventDefault();
 setError('');
 setBusy(true);
 try { await login(email,password);
 navigate('/');
 } catch(err) { setError(err.message);
 } finally { setBusy(false);
 } }
  return <div className="login-screen">
<div className="login-art">
<div className="brand large">
<span className="brand-mark">
<ShoppingBag size={23}/>
</span> vértice<span className="brand-light">.</span>
</div>
<div className="art-copy">
<span className="eyebrow">GESTÃO INTELIGENTE</span>
<h1>Sua loja, em<br/>um só lugar.</h1>
<p>Controle produtos, acompanhe vendas e tome decisões com mais clareza.</p>
<div className="art-stats">
<div>
<b>01</b>
<span>Estoque organizado</span>
</div>
<div>
<b>02</b>
<span>Vendas acompanhadas</span>
</div>
<div>
<b>03</b>
<span>Gestão simplificada</span>
</div>
</div>
</div>
<div className="art-foot">PLATAFORMA DE GESTÃO COMERCIAL</div>
</div>
<div className="login-panel">
<form className="login-form" onSubmit={submit}>
<div className="mobile-brand brand">
<span className="brand-mark">
<ShoppingBag size={20}/>
</span> vértice<span className="brand-light">.</span>
</div>
<span className="eyebrow">BEM-VINDO DE VOLTA</span>
<h2>Acesse sua conta</h2>
<p className="muted">Entre para gerenciar sua operação.</p>{error && <div className="alert">{error}</div>}<label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
</label>
<label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
</label>
<button className="btn primary full" disabled={busy}>{busy?'Entrando...':'Entrar na plataforma'}</button>
<div className="demo-hint">
<b>Acesso para demonstração</b>
<span>admin@loja.com · 123456</span>
<small>Conta criada pelo comando de seed.</small>
</div>
</form>
<span className="login-copyright">© 2026 Vértice Loja · Projeto acadêmico Full Stack</span>
</div>
</div>;

}
const nav = [
  { to:'/', label:'Visão geral', icon:LayoutDashboard, end:true },
  { to:'/produtos', label:'Produtos', icon:Package },
  { to:'/vendas', label:'Vendas', icon:ShoppingCart },
  { to:'/categorias', label:'Categorias', icon:Boxes },
  { to:'/fornecedores', label:'Fornecedores', icon:Users }
];

function Layout({ children }) {
  const { user, logout, stores, activeStoreId, selectStore, createStore, updateStore, deleteStore } = useAuth();

  const [menu, setMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeModalMode, setStoreModalMode] = useState('create');
  const [deleteStoreModalOpen, setDeleteStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [storeError, setStoreError] = useState('');
  const [storeSaving, setStoreSaving] = useState(false);

  const activeStore = stores.find((store) => String(store.id) === String(activeStoreId));


  async function handleStoreChange(event) {
    const value = event.target.value;

    if (value === 'new') {
      setStoreModalMode('create');
      setNewStoreName('');
      setStoreError('');
      setStoreModalOpen(true);
      event.target.value = activeStoreId;
      return;
    }
    if (value) selectStore(value);

  }

  function openEditStore() {
    if (!activeStore) return;
    setStoreModalMode('edit');
    setNewStoreName(activeStore.name || '');
    setStoreError('');
    setStoreModalOpen(true);
  }


  async function submitStore(event) {
    event.preventDefault();
    const name = newStoreName.trim();
    if (name.length < 2) { setStoreError('Informe um nome com pelo menos 2 caracteres.'); return; }
    setStoreSaving(true);
    setStoreError('');
    try {
      if (storeModalMode === 'edit') { await updateStore(activeStore.id, name); setStoreModalOpen(false); }
      else await createStore(name);
      setNewStoreName('');
    } catch (error) {
      setStoreError(error.message || 'Não foi possível salvar a loja.');
    } finally { setStoreSaving(false); }
  }


  async function confirmDeleteStore() {
    if (!activeStore) return;
    setStoreSaving(true);
    setStoreError('');
    try { await deleteStore(activeStore.id); setDeleteStoreModalOpen(false); }
    catch (error) { setStoreError(error.message || 'Não foi possível excluir a loja.'); }
    finally { setStoreSaving(false); }
  }


  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark">
              <ShoppingBag size={19} />
            </span>
            vértice<span className="brand-light">.</span>
          </div>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label={mobileNavOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <div className="workspace workspace-select">
          <div className="workspace-icon">VL</div>
          <div className="workspace-details">
            <b>{activeStore?.name || 'Carregando loja...'}</b>
            <small>Trocar ou adicionar loja</small>
          </div>
          <select aria-label="Selecionar loja" value={activeStoreId} onChange={handleStoreChange}>
            {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            <option value="new">+ Adicionar loja</option>
          </select>
          <ChevronDown size={15} />
        </div>
        <div className="store-management">
          <button type="button" className="store-management-button" onClick={openEditStore} disabled={!activeStore}>Editar loja</button>
          <button type="button" className="store-management-button store-delete-button" onClick={() => { setStoreError(''); setDeleteStoreModalOpen(true); }} disabled={stores.length <= 1 || !activeStore}>Excluir loja</button>
        </div>
        <span className="nav-caption">MENU PRINCIPAL</span>
        <nav className={mobileNavOpen ? 'mobile-nav-open' : ''}>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
<CircleHelp size={18} />
<b>Precisa de ajuda?</b>
<span>Consulte o guia do sistema.</span>
</div>
          <div className="profile" onClick={() => setMenu(!menu)}>
            <div className="avatar">{(user?.name || 'U').slice(0, 1).toUpperCase()}</div>
            <div className="profile-info">
<b>{user?.name || 'Usuário'}</b>
<small>{user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</small>
</div>
            <button className="icon-button" type="button">
<ChevronDown size={16} />
</button>
            {menu && <div className="profile-menu">
<button onClick={logout}>
<LogOut size={15} /> Sair da conta</button>
</div>}
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Vértice Loja <span>/</span> <b>{activeStore?.name || 'Painel'}</b>
</div>
          <div className="top-actions">
<span className="status-dot">
</span>
<span className="online-label">Sistema operacional</span>
<div className="avatar small">{(user?.name || 'U').slice(0, 1).toUpperCase()}</div>
</div>
        </header>
        <div className="page-content">{children}</div>
        <footer>© 2026 Vértice Loja <span>·</span> Plataforma de gestão comercial</footer>
      </main>
      {storeModalOpen && (
        <div className="modal-backdrop app-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setStoreModalOpen(false)}>
          <form className="modal app-dialog" onSubmit={submitStore}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">CONFIGURAÇÕES</span>
                <h2>{storeModalMode === 'edit' ? 'Editar loja' : 'Adicionar loja'}</h2>
              </div>
              <button type="button" className="icon-button" aria-label="Fechar" onClick={() => setStoreModalOpen(false)}><X /></button>
            </div>
            <p className="dialog-description">{storeModalMode === 'edit' ? 'Altere o nome da loja.' : 'Dê um nome para a nova loja. Você poderá alternar entre suas lojas pelo menu lateral.'}</p>
            <label className="dialog-field">Nome da loja
              <input autoFocus value={newStoreName} onChange={(event) => setNewStoreName(event.target.value)} placeholder="Ex.: Vértice Centro" maxLength={60} />
            </label>
            {storeError && <div className="alert dialog-error" role="alert">{storeError}</div>}
            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => setStoreModalOpen(false)}>Cancelar</button>
              <button className="btn primary" disabled={storeSaving}>{storeSaving ? (storeModalMode === 'edit' ? 'Salvando...' : 'Criando...') : (storeModalMode === 'edit' ? 'Salvar alterações' : 'Criar loja')}</button>
            </div>
          </form>
        </div>
      )}
      {deleteStoreModalOpen && activeStore && (
        <div className="modal-backdrop app-dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && setDeleteStoreModalOpen(false)}>
          <div className="modal app-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-store-title">
            <div className="modal-head"><div><span className="eyebrow">CONFIRMAR AÇÃO</span><h2 id="delete-store-title">Excluir loja?</h2></div><button type="button" className="icon-button" aria-label="Fechar" onClick={() => setDeleteStoreModalOpen(false)}><X /></button></div>
            <p className="dialog-description">Deseja excluir a loja <strong>{activeStore.name}</strong>? Só será possível excluir lojas sem produtos, categorias, vendas ou fornecedores cadastrados.</p>
            {storeError && <div className="alert dialog-error" role="alert">{storeError}</div>}
            <div className="modal-actions"><button type="button" className="btn secondary" onClick={() => setDeleteStoreModalOpen(false)}>Cancelar</button><button type="button" className="btn danger" disabled={storeSaving} onClick={confirmDeleteStore}>{storeSaving ? 'Excluindo...' : 'Excluir loja'}</button></div>
          </div>
        </div>
      )}
    </div>
  );

}
function PageHeader({ eyebrow, title, subtitle, action }) { return <div className="page-heading">
<div>
<span className="eyebrow">{eyebrow}</span>
<h1>{title}</h1>
<p>{subtitle}</p>
</div>{action}</div>;
 }
function Dashboard() {
  const [data, setData] = useState(null);

  const [products, setProducts] = useState([]);

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(true);


  async function loadDashboard() {
    setLoading(true);

    setError('');

    try {
      const [dashboardData, productList] = await Promise.all([
        api('/dashboard'),
        api('/products')
      ]);

      setData(dashboardData);

      setProducts(productList);

    } catch (requestError) {
      setError(requestError.message);

    } finally {
      setLoading(false);

    }
  }

  useEffect(() => { loadDashboard();
 }, []);


  const money = (value) => Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });


  const cards = data ? [
    { label: 'Produtos ativos', value: data.products, sub: 'Itens cadastrados', icon: Package, tone: 'blue' },
    { label: 'Vendas realizadas', value: data.sales, sub: 'Pedidos concluídos', icon: ShoppingCart, tone: 'violet' },
    { label: 'Faturamento total', value: money(data.revenue), sub: 'Valor acumulado', icon: ChartNoAxesCombined, tone: 'green' },
    { label: 'Estoque baixo', value: data.lowStock, sub: 'Produtos para revisar', icon: Activity, tone: 'orange' }
  ] : [];


  return (
    <>
      <PageHeader
        eyebrow="RESUMO DA OPERAÇÃO"
        title="Visão geral"
        subtitle="Acompanhe os principais indicadores da sua loja."
        action={<button className="btn secondary" onClick={loadDashboard} disabled={loading}>
<Activity size={16} /> {loading ? 'Atualizando...' : 'Atualizar dados'}</button>}
      />
      {error && <div className="alert">{error}</div>}
      <div className="metric-grid">
        {cards.map((card) => <div className="metric-card" key={card.label}>
          <div className="metric-top">
<span>{card.label}</span>
<span className={`metric-icon ${card.tone}`}>
<card.icon size={18} />
</span>
</div>
          <strong>{card.value}</strong>
<small>{card.sub}</small>
        </div>)}
      </div>
      {loading && !data && <div className="empty">Carregando indicadores...</div>}
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
<div>
<h3>Produtos em destaque</h3>
<p>Visão rápida do catálogo</p>
</div>
<NavLink to="/produtos" className="text-link">Ver produtos →</NavLink>
</div>
          <div className="product-list">{products.slice(0, 5).map((product) => <div className="product-row" key={product.id}>
            <div className="product-thumb">
<Package size={18} />
</div>
            <div className="product-meta">
<b>{product.name}</b>
<small>{product.category?.name || 'Sem categoria'} · SKU {product.sku || '—'}</small>
</div>
            <div className="product-price">
<b>{money(product.price)}</b>
<small className={product.stock <= product.minStock ? 'low' : ''}>{product.stock} em estoque</small>
</div>
          </div>)}</div>
          {!products.length && !loading && <div className="empty">Nenhum produto cadastrado.</div>}
        </section>
        <section className="panel">
          <div className="panel-head">
<div>
<h3>Movimentação recente</h3>
<p>Últimas vendas registradas</p>
</div>
<NavLink to="/vendas" className="text-link">Ver vendas →</NavLink>
</div>
          {data?.recentSales?.length ? data.recentSales.map((sale) => <div className="sale-row" key={sale.id}>
            <div className="sale-icon">
<ShoppingCart size={17} />
</div>
            <div className="product-meta">
<b>Venda #{String(sale.id).padStart(4, '0')}</b>
<small>{sale.user?.name} · {new Date(sale.createdAt).toLocaleDateString('pt-BR')}</small>
</div>
            <b>{money(sale.total)}</b>
          </div>) : <div className="empty">
<div className="empty-icon">
<ShoppingBag />
</div>
<b>Nenhuma venda por enquanto</b>
<span>As vendas registradas aparecerão aqui.</span>
</div>}
        </section>
      </div>
      <div className="insight-banner">
<div className="insight-icon">
<Activity size={20} />
</div>
<div>
<b>Dica de gestão</b>
<span>Monitore os itens com estoque baixo para evitar rupturas e não perder vendas.</span>
</div>
<NavLink to="/produtos">Revisar estoque →</NavLink>
</div>
    </>
  );

}
function Products() {
  const [items,setItems]=useState([]),[categories,setCategories]=useState([]),[search,setSearch]=useState(''),[modal,setModal]=useState(false),[editing,setEditing]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[confirmItem,setConfirmItem]=useState(null),[deleting,setDeleting]=useState(false);

  const blank={name:'',description:'',sku:'',price:'',cost:'',stock:0,minStock:5,categoryId:''};
 const [form,setForm]=useState(blank);

  async function load(){setLoading(true);
try{const [p,c]=await Promise.all([api('/products'),api('/categories')]);
setItems(p);
setCategories(c);
setError('')}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{load()},[]);

  const filtered=items.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||(p.sku||'').toLowerCase().includes(search.toLowerCase()));

  function open(item=null){setEditing(item);
setForm(item?{name:item.name,description:item.description||'',sku:item.sku||'',price:item.price,cost:item.cost??'',stock:item.stock,minStock:item.minStock,categoryId:item.categoryId}:blank);
setModal(true)}
  async function save(e){e.preventDefault();
try{const payload={...form,price:Number(form.price),cost:form.cost===''?null:Number(form.cost),stock:Number(form.stock),minStock:Number(form.minStock),categoryId:Number(form.categoryId)};
await api(editing?`/products/${editing.id}`:'/products',{method:editing?'PUT':'POST',body:JSON.stringify(payload)});
setModal(false);
await load()}catch(e){setError(e.message)}}
  async function removeConfirmed(){
    if (!confirmItem) return;
    setDeleting(true);
    try {
      await api(`/products/${confirmItem.id}`, { method: 'DELETE' });
      setConfirmItem(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  }
  function remove(item) { setConfirmItem(item); }
  const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return <>
<PageHeader eyebrow="CATÁLOGO DA LOJA" title="Produtos" subtitle="Gerencie os itens, preços e disponibilidade do seu catálogo." action={<button className="btn primary" onClick={()=>open()}>
<Plus size={17}/> Novo produto</button>}/>{error&&<div className="alert">{error}<button onClick={()=>setError('')}>
<X size={14}/>
</button>
</div>}<section className="panel table-panel">
<div className="toolbar">
<div className="search-box">
<Search size={17}/>
<input placeholder="Buscar por produto ou SKU..." value={search} onChange={e=>setSearch(e.target.value)}/>
</div>
<span className="count-label">{filtered.length} produtos</span>
</div>
<div className="table-wrap">
<table>
<thead>
<tr>
<th>PRODUTO</th>
<th>CATEGORIA</th>
<th>PREÇO</th>
<th>ESTOQUE</th>
<th>STATUS</th>
<th>
</th>
</tr>
</thead>
<tbody>{filtered.map(p=>
<tr key={p.id}>
<td>
<div className="table-product">
<div className="product-thumb">
<Package size={17}/>
</div>
<div>
<b>{p.name}</b>
<small>SKU: {p.sku||'—'}</small>
</div>
</div>
</td>
<td>{p.category?.name}</td>
<td>
<b>{money(p.price)}</b>
</td>
<td>{p.stock} un.</td>
<td>
<span className={`pill ${p.stock<=p.minStock?'warning':'success'}`}>{p.stock<=p.minStock?'Estoque baixo':'Disponível'}</span>
</td>
<td>
<div className="table-actions">
<button onClick={()=>open(p)}>Editar</button>
<button className="danger-text" onClick={()=>remove(p)}>Excluir</button>
</div>
</td>
</tr>)}</tbody>
</table>{loading&&<div className="empty">Carregando...</div>}{!loading&&!filtered.length&&<div className="empty">Nenhum produto encontrado.</div>}</div>
</section>{confirmItem && <div className="modal-backdrop app-dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && setConfirmItem(null)}>
  <div className="modal app-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title">
    <div className="modal-head"><div><span className="eyebrow">CONFIRMAR AÇÃO</span><h2 id="delete-product-title">Desativar produto?</h2></div><button type="button" className="icon-button" aria-label="Fechar" onClick={() => setConfirmItem(null)}><X /></button></div>
    <p className="dialog-description">O produto <strong>{confirmItem.name}</strong> ficará inativo e não aparecerá como disponível para novas operações. Deseja continuar?</p>
    <div className="modal-actions"><button type="button" className="btn secondary" onClick={() => setConfirmItem(null)}>Cancelar</button><button type="button" className="btn danger" disabled={deleting} onClick={removeConfirmed}>{deleting ? 'Desativando...' : 'Sim, desativar'}</button></div>
  </div>
</div>}{modal&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setModal(false)}>
<form className="modal" onSubmit={save}>
<div className="modal-head">
<div>
<span className="eyebrow">CATÁLOGO</span>
<h2>{editing?'Editar produto':'Novo produto'}</h2>
</div>
<button type="button" className="icon-button" onClick={()=>setModal(false)}>
<X/>
</button>
</div>
<div className="form-grid">
<label className="span-2">Nome do produto<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
</label>
<label>SKU<input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="Ex.: PRD-001"/>
</label>
<label>Categoria<select required value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}>
<option value="">Selecione</option>{categories.map(c=>
<option value={c.id} key={c.id}>{c.name}</option>)}</select>
</label>
<label>Preço de venda (R$)<input type="number" min="0.01" step="0.01" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
</label>
<label>Custo (R$)<input type="number" min="0" step="0.01" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})}/>
</label>
<label>Quantidade em estoque<input type="number" min="0" required value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/>
</label>
<label>Estoque mínimo<input type="number" min="0" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})}/>
</label>
<label className="span-2">Descrição<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
</label>
</div>
<div className="modal-actions">
<button type="button" className="btn secondary" onClick={()=>setModal(false)}>Cancelar</button>
<button className="btn primary">Salvar produto</button>
</div>
</form>
</div>}</>;

}
function Categories() {
  const [items,setItems]=useState([]),[name,setName]=useState(''),[error,setError]=useState('');

  async function load(){try{setItems(await api('/categories'))}catch(e){setError(e.message)}} useEffect(()=>{load()},[]);

  async function add(e){e.preventDefault();
try{await api('/categories',{method:'POST',body:JSON.stringify({name})});
setName('');
load()}catch(e){setError(e.message)}}
  return <>
<PageHeader eyebrow="ORGANIZAÇÃO" title="Categorias" subtitle="Agrupe seus produtos para manter o catálogo organizado."/>
<section className="panel category-panel">
<form className="inline-form" onSubmit={add}>
<label>Nova categoria<input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Papelaria, Vestuário..." required minLength="2"/>
</label>
<button className="btn primary">
<Plus size={17}/> Adicionar</button>
</form>{error&&<div className="alert">{error}</div>}<div className="category-grid">{items.map(c=>
<div className="category-card" key={c.id}>
<div className="category-symbol">
<Boxes size={20}/>
</div>
<div>
<b>{c.name}</b>
<small>Categoria cadastrada</small>
</div>
</div>)}</div>
</section>
</>;

}
function Sales() {
  const [sales,setSales]=useState([]),[products,setProducts]=useState([]),[error,setError]=useState(''),[cart,setCart]=useState([]),[customer,setCustomer]=useState('');

  async function load(){try{const [s,p]=await Promise.all([api('/sales'),api('/products')]);
setSales(s);
setProducts(p)}catch(e){setError(e.message)}} useEffect(()=>{load()},[]);

  function add(productId){const p=products.find(x=>x.id===Number(productId));
if(!p)return;
setCart(old=>{const existing=old.find(x=>x.productId===p.id);
if(existing)return old.map(x=>x.productId===p.id?{...x,quantity:Math.min(x.quantity+1,p.stock)}:x);
return [...old,{productId:p.id,quantity:1,name:p.name,price:Number(p.price),stock:p.stock}]})}
  function change(id,quantity){setCart(old=>old.map(x=>x.productId===id?{...x,quantity:Math.max(1,Math.min(Number(quantity)||1,x.stock))}:x))}
  async function finish(){try{await api('/sales',{method:'POST',body:JSON.stringify({customer,items:cart.map(({productId,quantity})=>({productId,quantity}))})});
setCart([]);
setCustomer('');
load()}catch(e){setError(e.message)}}
  const total=cart.reduce((sum,x)=>sum+x.price*x.quantity,0),money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return <>
<PageHeader eyebrow="OPERAÇÃO COMERCIAL" title="Vendas" subtitle="Registre pedidos e acompanhe o histórico de vendas."/>
<div className="sales-layout">
<section className="panel">
<div className="panel-head">
<div>
<h3>Nova venda</h3>
<p>Adicione os produtos ao pedido</p>
</div>
</div>
<label className="field-label">Selecionar produto<select defaultValue="" onChange={e=>{add(e.target.value);
e.target.value=''}}>
<option value="" disabled>Escolha um produto...</option>{products.filter(p=>p.stock>0).map(p=>
<option value={p.id} key={p.id}>{p.name} · {money(p.price)} · {p.stock} disponíveis</option>)}</select>
</label>
<div className="cart-items">{cart.map(x=>
<div className="cart-row" key={x.productId}>
<div className="product-thumb">
<Package size={17}/>
</div>
<div className="product-meta">
<b>{x.name}</b>
<small>{money(x.price)} cada</small>
</div>
<input className="qty-input" type="number" min="1" max={x.stock} value={x.quantity} onChange={e=>change(x.productId,e.target.value)}/>
<b>{money(x.price*x.quantity)}</b>
<button className="icon-button" onClick={()=>setCart(cart.filter(i=>i.productId!==x.productId))}>
<X size={16}/>
</button>
</div>)}</div>
<label className="field-label">Cliente (opcional)<input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Nome do cliente"/>
</label>
<div className="checkout-total">
<span>Total do pedido</span>
<strong>{money(total)}</strong>
</div>
<button className="btn primary full" disabled={!cart.length} onClick={finish}>
<ShoppingCart size={17}/> Finalizar venda</button>{error&&<div className="alert">{error}</div>}</section>
<section className="panel">
<div className="panel-head">
<div>
<h3>Histórico de vendas</h3>
<p>Últimos pedidos registrados</p>
</div>
<span className="count-label">{sales.length} vendas</span>
</div>
<div className="history-list">{sales.map(s=>
<div className="history-row" key={s.id}>
<div className="sale-icon">
<ShoppingCart size={17}/>
</div>
<div className="product-meta">
<b>Venda #{String(s.id).padStart(4,'0')}</b>
<small>{s.customer||'Cliente não informado'} · {new Date(s.createdAt).toLocaleString('pt-BR')}</small>
</div>
<b>{money(s.total)}</b>
</div>)}</div>{!sales.length&&<div className="empty">Nenhuma venda registrada.</div>}</section>
</div>
</>;

}
function Suppliers() {
  const [items,setItems]=useState([]),[error,setError]=useState(''),[form,setForm]=useState({name:'',document:'',email:'',phone:'',cep:'',street:'',number:'',district:'',city:'',state:''}),[busy,setBusy]=useState(false);

  async function load(){try{setItems(await api('/suppliers'))}catch(e){setError(e.message)}} useEffect(()=>{load()},[]);

  async function lookupCep(){try{setBusy(true);
const d=await api(`/cep/${form.cep}`);
setForm(f=>({...f,street:d.logradouro||'',district:d.bairro||'',city:d.localidade||'',state:d.uf||''}))}catch(e){setError(e.message)}finally{setBusy(false)}}
  async function save(e){e.preventDefault();
try{await api('/suppliers',{method:'POST',body:JSON.stringify(form)});
setForm({name:'',document:'',email:'',phone:'',cep:'',street:'',number:'',district:'',city:'',state:''});
load()}catch(e){setError(e.message)}}
  return <>
<PageHeader eyebrow="REDE DE PARCEIROS" title="Fornecedores" subtitle="Mantenha os contatos e endereços dos parceiros da sua loja."/>
<div className="sales-layout">
<section className="panel">
<div className="panel-head">
<div>
<h3>Novo fornecedor</h3>
<p>Cadastre os dados comerciais e de contato</p>
</div>
</div>
<form className="supplier-form" onSubmit={save}>
<label className="field-label">Nome / Razão social<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
</label>
<div className="form-grid">
<label>CPF / CNPJ<input value={form.document} onChange={e=>setForm({...form,document:e.target.value})}/>
</label>
<label>Telefone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
</label>
<label className="span-2">E-mail<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
</label>
<label>CEP<div className="cep-line">
<input value={form.cep} onChange={e=>setForm({...form,cep:e.target.value})} placeholder="00000-000"/>
<button type="button" className="btn secondary" disabled={busy} onClick={lookupCep}>{busy?'...':'Buscar'}</button>
</div>
</label>
<label>Número<input value={form.number} onChange={e=>setForm({...form,number:e.target.value})}/>
</label>
<label className="span-2">Rua<input value={form.street} onChange={e=>setForm({...form,street:e.target.value})}/>
</label>
<label>Bairro<input value={form.district} onChange={e=>setForm({...form,district:e.target.value})}/>
</label>
<label>Cidade<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/>
</label>
<label>Estado<input value={form.state} onChange={e=>setForm({...form,state:e.target.value})}/>
</label>
</div>
<button className="btn primary full">Salvar fornecedor</button>
</form>{error&&<div className="alert">{error}</div>}</section>
<section className="panel">
<div className="panel-head">
<div>
<h3>Fornecedores cadastrados</h3>
<p>Parceiros da operação</p>
</div>
<span className="count-label">{items.length} registros</span>
</div>{items.map(x=>
<div className="history-row" key={x.id}>
<div className="sale-icon">
<Users size={17}/>
</div>
<div className="product-meta">
<b>{x.name}</b>
<small>{x.city?`${x.city} - ${x.state||''}`:'Endereço não informado'} · {x.phone||'Sem telefone'}</small>
</div>
</div>)}{!items.length&&<div className="empty">Nenhum fornecedor cadastrado.</div>}</section>
</div>
</>;

}

function App() { return <AuthProvider>
<Routes>
<Route path="/login" element={<Login/>}/>
<Route path="/*" element={<Protected>
<Layout>
<Routes>
<Route path="/" element={<Dashboard/>}/>
<Route path="/produtos" element={<Products/>}/>
<Route path="/vendas" element={<Sales/>}/>
<Route path="/categorias" element={<Categories/>}/>
<Route path="/fornecedores" element={<Suppliers/>}/>
<Route path="*" element={<Navigate to="/" replace/>}/>
</Routes>
</Layout>
</Protected>}/>
</Routes>
</AuthProvider>;
 }
export default App;
