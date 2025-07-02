// =============================================
// CONFIGURAÇÃO DO SUPABASE
// =============================================
// 🔧 PARA ATIVAR O SUPABASE REAL:
// 1. Vá em: https://supabase.com/dashboard/project/SEU-PROJETO/settings/api
// 2. Copie a "Project URL" e "anon public key"  
// 3. Substitua as linhas abaixo pelas suas credenciais
// 4. Mude USE_REAL_SUPABASE para true

// 📝 EXEMPLO DE COMO DEVE FICAR:
// const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
// const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.exemplo';

const SUPABASE_URL = 'https://lbfhxcjdqbrsrusrmwwd.supabase.co'; // 👈 SUBSTITUA pela sua URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiZmh4Y2pkcWJyc3J1c3Jtd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMzM3MTcsImV4cCI6MjA2NjkwOTcxN30._tgctgaHiy5yqHGmiisCJYEYTNsvXA_B16pL7I4XRrI'; // 👈 SUBSTITUA pela sua chave

// Para usar Supabase real, descomente as linhas abaixo e comente todo o mock
/*
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
*/

// =============================================
// FUNÇÃO PARA ALTERNAR ENTRE MOCK E SUPABASE REAL
// =============================================
const USE_REAL_SUPABASE = true; // 👈 MUDE PARA true APÓS CONFIGURAR AS CREDENCIAIS

// Cliente Supabase (será definido baseado na configuração)
let supabaseClient;

// =============================================
// MOCK DO SUPABASE PARA DESENVOLVIMENTO
// =============================================
const mockSupabase = {
    auth: {
        signUp: async (credentials) => {
            console.log('SignUp:', credentials);
            return { data: { user: { id: 'mock-user-id', email: credentials.email } }, error: null };
        },
        signInWithPassword: async (credentials) => {
            console.log('SignIn:', credentials);
            return { data: { user: { id: 'mock-user-id', email: credentials.email } }, error: null };
        },
        signOut: async () => {
            console.log('SignOut');
            return { error: null };
        },
        onAuthStateChange: (callback) => {
            // Mock auth state change
            return { data: { subscription: { unsubscribe: () => {} } } };
        },
        getUser: async () => {
            return { data: { user: JSON.parse(localStorage.getItem('currentUser')) }, error: null };
        }
    },
    from: (table) => ({
        select: (columns = '*') => ({
            eq: (column, value) => ({
                order: (column, options) => mockQuery(table, 'select', { columns, eq: { column, value }, order: { column, options } }),
                then: (resolve) => resolve(mockQuery(table, 'select', { columns, eq: { column, value } }))
            }),
            order: (column, options) => mockQuery(table, 'select', { columns, order: { column, options } }),
            then: (resolve) => resolve(mockQuery(table, 'select', { columns }))
        }),
        insert: (data) => ({
            then: (resolve) => resolve(mockQuery(table, 'insert', data))
        }),
        update: (data) => ({
            eq: (column, value) => ({
                then: (resolve) => resolve(mockQuery(table, 'update', { data, eq: { column, value } }))
            })
        }),
        delete: () => ({
            eq: (column, value) => ({
                then: (resolve) => resolve(mockQuery(table, 'delete', { eq: { column, value } }))
            })
        })
    })
};

// Mock data para desenvolvimento
const mockData = {
    categorias: [
        { id: 1, nome: 'Encanador' },
        { id: 2, nome: 'Eletricista' },
        { id: 3, nome: 'Diarista' },
        { id: 4, nome: 'Jardineiro' },
        { id: 5, nome: 'Pintor' },
        { id: 6, nome: 'Marceneiro' },
        { id: 7, nome: 'Pedreiro' },
        { id: 8, nome: 'Mecânico' }
    ],
    prestadores: [
        {
            id: '1',
            nome: 'João Silva',
            descricao: 'Encanador com 10 anos de experiência. Especialista em instalações residenciais e comerciais.',
            telefone_whatsapp: '11999999999',
            categoria_id: 1,
            media_rank: 4.8,
            total_avaliacoes: 25,
            categoria_nome: 'Encanador'
        },
        {
            id: '2',
            nome: 'Maria Santos',
            descricao: 'Eletricista certificada. Instalações elétricas, manutenção e reparos em geral.',
            telefone_whatsapp: '11888888888',
            categoria_id: 2,
            media_rank: 4.9,
            total_avaliacoes: 32,
            categoria_nome: 'Eletricista'
        },
        {
            id: '3',
            nome: 'Ana Oliveira',
            descricao: 'Diarista experiente e confiável. Limpeza residencial e comercial com produtos próprios.',
            telefone_whatsapp: '11777777777',
            categoria_id: 3,
            media_rank: 4.7,
            total_avaliacoes: 18,
            categoria_nome: 'Diarista'
        },
        {
            id: '4',
            nome: 'Carlos Pereira',
            descricao: 'Jardineiro especialista em paisagismo. Manutenção de jardins e criação de projetos verdes.',
            telefone_whatsapp: '11666666666',
            categoria_id: 4,
            media_rank: 4.6,
            total_avaliacoes: 14,
            categoria_nome: 'Jardineiro'
        }
    ],
    avaliacoes: [
        {
            id: '1',
            prestador_id: '1',
            contratante_id: 'mock-user-id',
            nota: 5,
            comentario: 'Excelente trabalho! Muito profissional e pontual.',
            created_at: '2025-06-25T10:30:00Z'
        },
        {
            id: '2',
            prestador_id: '1',
            contratante_id: 'mock-user-id-2',
            nota: 4,
            comentario: 'Bom serviço, recomendo.',
            created_at: '2025-06-20T14:15:00Z'
        }
    ]
};

// Função mock para simular queries do Supabase
function mockQuery(table, operation, params = {}) {
    return new Promise((resolve) => {
        setTimeout(() => {
            let result = { data: null, error: null };
            
            switch (table) {
                case 'categorias':
                    if (operation === 'select') {
                        result.data = mockData.categorias;
                    }
                    break;
                case 'prestadores':
                    if (operation === 'select') {
                        let data = [...mockData.prestadores];
                        
                        // Se está fazendo join com categorias, adicionar dados da categoria
                        if (params.columns && params.columns.includes('categorias')) {
                            data = data.map(prestador => {
                                const categoria = mockData.categorias.find(cat => cat.id === prestador.categoria_id);
                                return {
                                    ...prestador,
                                    categorias: categoria ? { nome: categoria.nome } : null
                                };
                            });
                        }
                        
                        if (params.eq) {
                            data = data.filter(item => item[params.eq.column] === params.eq.value);
                        }
                        if (params.order) {
                            data.sort((a, b) => {
                                const aVal = a[params.order.column];
                                const bVal = b[params.order.column];
                                return params.order.options?.ascending ? aVal - bVal : bVal - aVal;
                            });
                        }
                        result.data = data;
                    } else if (operation === 'insert') {
                        const newPrestador = { 
                            ...params, 
                            id: Date.now().toString(),
                            categoria_id: parseInt(params.categoria_id) || null,
                            media_rank: 0,
                            total_avaliacoes: 0
                        };
                        mockData.prestadores.push(newPrestador);
                        result.data = [newPrestador];
                    }
                    break;
                case 'avaliacoes':
                    if (operation === 'select') {
                        let data = [...mockData.avaliacoes];
                        if (params.eq) {
                            data = data.filter(item => item[params.eq.column] === params.eq.value);
                        }
                        result.data = data;
                    } else if (operation === 'insert') {
                        const newAvaliacao = { ...params, id: Date.now().toString(), created_at: new Date().toISOString() };
                        mockData.avaliacoes.push(newAvaliacao);
                        result.data = [newAvaliacao];
                    }
                    break;
            }
            
            resolve(result);
        }, 300); // Simula delay de rede
    });
}

// Estado da aplicação
let currentUser = null;
let prestadores = [];
let categorias = [];
let filteredPrestadores = [];
let currentPrestador = null;

// Carousel state
let currentSlide = 0;
let carouselInterval;
const totalSlides = 5;

// Elementos DOM
const elements = {
    // Navigation
    navToggle: document.getElementById('navToggle'),
    navMenu: document.getElementById('navMenu'),
    loginBtn: document.getElementById('loginBtn'),
    cadastroBtn: document.getElementById('cadastroBtn'),
    perfilBtn: document.getElementById('perfilBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Search
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    categoryFilter: document.getElementById('categoryFilter'),
    sortSelect: document.getElementById('sortSelect'),
    
    // Prestadores
    prestadoresGrid: document.getElementById('prestadoresGrid'),
    loading: document.getElementById('loading'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    
    // Modals
    loginModal: document.getElementById('loginModal'),
    cadastroModal: document.getElementById('cadastroModal'),
    prestadorModal: document.getElementById('prestadorModal'),
    ratingModal: document.getElementById('ratingModal'),
    
    // Forms
    loginForm: document.getElementById('loginForm'),
    cadastroForm: document.getElementById('cadastroForm'),
    ratingForm: document.getElementById('ratingForm'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    toastClose: document.getElementById('toastClose')
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async () => {
    initializeSupabase();
    await initializeApp();
    setupEventListeners();
    await loadInitialData();
    initializeCarousel();
});

// Inicializar Supabase baseado na configuração
function initializeSupabase() {
    if (USE_REAL_SUPABASE) {
        // Validar credenciais
        if (SUPABASE_URL === 'https://seu-projeto.supabase.co' || SUPABASE_ANON_KEY === 'sua-chave-anon') {
            console.error('❌ Credenciais do Supabase não foram configuradas!');
            console.log('📋 Siga as instruções no documento "🚀 Configuração Final - Ativar Supabase"');
            USE_REAL_SUPABASE = false;
            showToast('⚠️ Configure as credenciais do Supabase para usar modo produção', 'error');
        } else if (typeof supabase !== 'undefined' && supabase.createClient) {
            // Usar Supabase real
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Conectado ao Supabase:', SUPABASE_URL.replace(/https:\/\//, '').split('.')[0]);
            showToast('✅ Conectado ao Supabase - Modo Produção Ativo!', 'success');
        } else {
            console.error('❌ Biblioteca do Supabase não foi carregada');
            USE_REAL_SUPABASE = false;
        }
    }
    
    if (!USE_REAL_SUPABASE) {
        // Usar mock
        supabaseClient = mockSupabase;
        console.log('🔧 Usando modo de desenvolvimento (mock)');
        
        // Mostrar indicador de desenvolvimento
        const devIndicator = document.getElementById('devModeIndicator');
        if (devIndicator) {
            devIndicator.style.display = 'block';
        }
    }
}

// Inicializar aplicação
async function initializeApp() {
    // Verificar se usuário está logado
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        currentUser = user;
        updateUIForLoggedUser();
    }
    
    // Monitorar mudanças de autenticação
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            updateUIForLoggedUser();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateUIForLoggedOut();
        }
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Navigation
    elements.navToggle?.addEventListener('click', toggleNavMenu);
    elements.loginBtn?.addEventListener('click', () => openModal('loginModal'));
    elements.cadastroBtn?.addEventListener('click', () => openModal('cadastroModal'));
    elements.logoutBtn?.addEventListener('click', handleLogout);
    
    // Search
    elements.searchInput?.addEventListener('input', handleSearch);
    elements.searchBtn?.addEventListener('click', handleSearch);
    elements.categoryFilter?.addEventListener('change', handleCategoryFilter);
    elements.sortSelect?.addEventListener('change', handleSort);
    
    // Forms
    elements.loginForm?.addEventListener('submit', handleLogin);
    elements.cadastroForm?.addEventListener('submit', handleCadastro);
    elements.ratingForm?.addEventListener('submit', handleRating);
    
    // Modal closes
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.getAttribute('data-modal');
            closeModal(modalId);
        });
    });
    
    // Modal overlays
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Cadastro form - toggle prestador fields
    document.querySelectorAll('input[name="userType"]').forEach(radio => {
        radio.addEventListener('change', togglePrestadorFields);
    });
    
    // Modal links
    document.getElementById('showCadastroModal')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        openModal('cadastroModal');
    });
    
    document.getElementById('showLoginModal')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('cadastroModal');
        openModal('loginModal');
    });
    
    // Toast close
    elements.toastClose?.addEventListener('click', hideToast);
    
    // Rating stars
    setupRatingStars();
    
    // Carousel navigation
    document.getElementById('carouselPrev')?.addEventListener('click', () => {
        changeSlide(currentSlide - 1);
        resetCarouselInterval();
    });
    
    document.getElementById('carouselNext')?.addEventListener('click', () => {
        changeSlide(currentSlide + 1);
        resetCarouselInterval();
    });
    
    // Carousel indicators
    document.querySelectorAll('.indicator').forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            changeSlide(index);
            resetCarouselInterval();
        });
    });
    
    // Click outside to close nav menu
    document.addEventListener('click', (e) => {
        if (!elements.navMenu?.contains(e.target) && !elements.navToggle?.contains(e.target)) {
            elements.navMenu?.classList.remove('active');
        }
    });
}

// Carregar dados iniciais
async function loadInitialData() {
    try {
        // Carregar categorias PRIMEIRO
        const { data: categoriasData } = await supabaseClient.from('categorias').select('*');
        categorias = categoriasData || [];
        populateCategorySelects();
        
        // Aguardar um momento para garantir que as categorias estejam carregadas
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Carregar prestadores DEPOIS
        await loadPrestadores();
        
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        showToast('Erro ao carregar dados. Tente novamente.', 'error');
    }
}

// Carregar prestadores
async function loadPrestadores() {
    try {
        elements.loading?.classList.remove('hidden');
        
        const { data: prestadoresData } = await supabaseClient
            .from('prestadores')
            .select(`
                *,
                categorias (nome)
            `)
            .order('media_rank', { ascending: false });
        
        prestadores = (prestadoresData || []).map(p => {
            // Encontrar categoria pelo ID se não vier do join
            let categoriaNome = 'Sem categoria';
            
            if (p.categorias?.nome) {
                categoriaNome = p.categorias.nome;
            } else if (p.categoria_id) {
                const categoria = categorias.find(cat => cat.id === p.categoria_id);
                categoriaNome = categoria?.nome || 'Sem categoria';
            }
            
            return {
                ...p,
                categoria_nome: categoriaNome
            };
        });
        
        filteredPrestadores = [...prestadores];
        renderPrestadores();
        
    } catch (error) {
        console.error('Erro ao carregar prestadores:', error);
        showToast('Erro ao carregar prestadores. Tente novamente.', 'error');
    } finally {
        elements.loading?.classList.add('hidden');
    }
}

// Renderizar prestadores
function renderPrestadores() {
    if (!elements.prestadoresGrid) return;
    
    if (filteredPrestadores.length === 0) {
        elements.prestadoresGrid.innerHTML = `
            <div class="no-results">
                <p>Nenhum prestador encontrado.</p>
            </div>
        `;
        return;
    }
    
    const prestadoresHTML = filteredPrestadores.map(prestador => `
        <div class="prestador-card" onclick="openPrestadorModal('${prestador.id}')">
            <div class="prestador-header">
                <div>
                    <h3 class="prestador-name">${prestador.nome}</h3>
                    <p class="prestador-categoria">${prestador.categoria_nome}</p>
                </div>
                <div class="prestador-rating">
                    <div class="stars">${generateStars(prestador.media_rank)}</div>
                    <span class="rating-text">${prestador.media_rank.toFixed(1)} (${prestador.total_avaliacoes})</span>
                </div>
            </div>
            <p class="prestador-descricao">${prestador.descricao}</p>
            <div class="prestador-footer">
                <a href="${generateWhatsAppLink(prestador.telefone_whatsapp, prestador.nome)}" 
                   class="whatsapp-btn" 
                   onclick="event.stopPropagation()" 
                   target="_blank">
                    💬 WhatsApp
                </a>
            </div>
        </div>
    `).join('');
    
    elements.prestadoresGrid.innerHTML = prestadoresHTML;
}

// Gerar estrelas para avaliação
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '⭐';
    }
    
    if (hasHalfStar) {
        stars += '⭐';
    }
    
    // Completar com estrelas vazias até 5
    const totalStars = fullStars + (hasHalfStar ? 1 : 0);
    for (let i = totalStars; i < 5; i++) {
        stars += '☆';
    }
    
    return stars;
}

// Gerar link do WhatsApp
function generateWhatsAppLink(telefone, nomePrestador) {
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá ${nomePrestador}! Vi seu perfil no Faz Bico! e gostaria de solicitar um orçamento.`);
    return `https://wa.me/55${numeroLimpo}?text=${mensagem}`;
}

// Populadar selects de categoria
function populateCategorySelects() {
    const selects = [elements.categoryFilter, document.getElementById('cadastroCategoria')];
    
    selects.forEach(select => {
        if (!select) return;
        
        // Manter primeira opção
        const firstOption = select.children[0];
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        // Adicionar categorias
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            select.appendChild(option);
        });
    });
}

// Event Handlers
function toggleNavMenu() {
    elements.navMenu?.classList.toggle('active');
}

function handleSearch() {
    const searchTerm = elements.searchInput?.value.toLowerCase() || '';
    
    filteredPrestadores = prestadores.filter(prestador => 
        prestador.nome.toLowerCase().includes(searchTerm) ||
        prestador.descricao.toLowerCase().includes(searchTerm) ||
        prestador.categoria_nome.toLowerCase().includes(searchTerm)
    );
    
    renderPrestadores();
}

function handleCategoryFilter() {
    const categoryId = elements.categoryFilter?.value;
    
    if (!categoryId) {
        filteredPrestadores = [...prestadores];
    } else {
        filteredPrestadores = prestadores.filter(prestador => 
            prestador.categoria_id.toString() === categoryId
        );
    }
    
    renderPrestadores();
}

function handleSort() {
    const sortValue = elements.sortSelect?.value;
    
    switch (sortValue) {
        case 'rating':
            filteredPrestadores.sort((a, b) => b.media_rank - a.media_rank);
            break;
        case 'recent':
            filteredPrestadores.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            break;
        case 'alphabetical':
            filteredPrestadores.sort((a, b) => a.nome.localeCompare(b.nome));
            break;
    }
    
    renderPrestadores();
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    if (!email || !password) {
        showToast('Preencha todos os campos', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        showToast('Login realizado com sucesso!', 'success');
        closeModal('loginModal');
        elements.loginForm?.reset();
        
        // Mock: salvar usuário no localStorage para desenvolvimento
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
    } catch (error) {
        console.error('Erro no login:', error);
        showToast('Erro no login. Verifique suas credenciais.', 'error');
    }
}

async function handleCadastro(e) {
    e.preventDefault();
    
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    const nome = document.getElementById('cadastroNome')?.value;
    const email = document.getElementById('cadastroEmail')?.value;
    const password = document.getElementById('cadastroPassword')?.value;
    const telefone = document.getElementById('cadastroTelefone')?.value;
    const descricao = document.getElementById('cadastroDescricao')?.value;
    const categoria = document.getElementById('cadastroCategoria')?.value;
    
    console.log('🔍 Dados do formulário:', {
        userType, nome, email, telefone, descricao, categoria
    });
    
    if (!userType || !nome || !email || !password) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    if (userType === 'prestador' && (!telefone || !categoria)) {
        showToast('Prestadores devem informar telefone e categoria', 'error');
        return;
    }
    
    try {
        console.log('🔄 Iniciando cadastro de usuário...');
        
        // Criar usuário
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nome,
                    user_type: userType
                }
            }
        });
        
        console.log('📤 Resposta do signUp:', { data, error });
        
        if (error) {
            console.error('❌ Erro no signUp:', error);
            throw error;
        }
        
        if (!data.user) {
            console.error('❌ Usuário não foi criado');
            throw new Error('Falha ao criar usuário');
        }
        
        console.log('✅ Usuário criado:', data.user.id);
        
        // Criar perfil baseado no tipo de usuário
        try {
            if (userType === 'prestador') {
                console.log('🔄 Criando prestador...');
                
                const prestadorData = {
                    id: data.user.id,
                    nome,
                    descricao: descricao || '',
                    telefone_whatsapp: telefone,
                    categoria_id: parseInt(categoria)
                };
                
                console.log('📤 Dados do prestador:', prestadorData);
                
                const { data: prestadorResult, error: prestadorError } = await supabaseClient
                    .from('prestadores')
                    .insert(prestadorData);
                
                console.log('📥 Resposta prestadores:', { prestadorResult, prestadorError });
                
                if (prestadorError) {
                    console.error('❌ Erro detalhado prestador:', prestadorError);
                    throw new Error(`Erro ao criar prestador: ${prestadorError.message}`);
                }
                
                console.log('✅ Prestador criado com sucesso');
                
            } else if (userType === 'contratante') {
                console.log('🔄 Criando contratante...');
                
                const contratanteData = {
                    id: data.user.id,
                    nome,
                    telefone: telefone || null
                };
                
                console.log('📤 Dados do contratante:', contratanteData);
                
                const { data: contratanteResult, error: contratanteError } = await supabaseClient
                    .from('contratantes')
                    .insert(contratanteData);
                
                console.log('📥 Resposta contratantes:', { contratanteResult, contratanteError });
                
                if (contratanteError) {
                    console.error('❌ Erro detalhado contratante:', contratanteError);
                    throw new Error(`Erro ao criar contratante: ${contratanteError.message}`);
                }
                
                console.log('✅ Contratante criado com sucesso');
            }
        } catch (profileError) {
            console.error('❌ Erro ao criar perfil:', profileError);
            // Em caso de erro no perfil, tentar limpar o usuário criado
            try {
                await supabaseClient.auth.signOut();
                console.log('🧹 Usuário removido devido ao erro no perfil');
            } catch (cleanupError) {
                console.error('❌ Erro ao limpar usuário:', cleanupError);
            }
            throw profileError;
        }
        
        showToast('Cadastro realizado com sucesso!', 'success');
        closeModal('cadastroModal');
        elements.cadastroForm?.reset();
        
        // Recarregar prestadores se um novo foi cadastrado
        if (userType === 'prestador') {
            await loadPrestadores();
        }
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        
        // Tratamento específico para diferentes tipos de erro
        if (error.message?.includes('For security purposes')) {
            const seconds = error.message.match(/(\d+) seconds/)?.[1] || '60';
            showToast(`⏰ Aguarde ${seconds} segundos antes de tentar novamente por segurança`, 'error');
        } else if (error.message?.includes('User already registered')) {
            showToast('❌ Este email já está cadastrado. Tente fazer login.', 'error');
        } else if (error.message?.includes('Invalid email')) {
            showToast('❌ Email inválido. Verifique o formato.', 'error');
        } else if (error.message?.includes('Password should be at least')) {
            showToast('❌ A senha deve ter pelo menos 6 caracteres.', 'error');
        } else if (error.message?.includes('foreign key constraint')) {
            showToast('❌ Erro de configuração do banco. Execute a correção SQL.', 'error');
            console.error('🔧 SOLUÇÃO: Execute o SQL de correção no Supabase para corrigir as foreign keys');
        } else if (error.message?.includes('violates')) {
            showToast('❌ Erro de validação no banco de dados.', 'error');
        } else {
            showToast(`❌ Erro no cadastro: ${error.message}`, 'error');
        }
    }
}

async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        localStorage.removeItem('currentUser');
        showToast('Logout realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro no logout:', error);
        showToast('Erro no logout. Tente novamente.', 'error');
    }
}

function togglePrestadorFields() {
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    const prestadorFields = document.querySelectorAll('.prestador-fields');
    
    prestadorFields.forEach(field => {
        if (userType === 'prestador') {
            field.classList.remove('hidden');
        } else {
            field.classList.add('hidden');
        }
    });
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Prestador modal
async function openPrestadorModal(prestadorId) {
    currentPrestador = prestadores.find(p => p.id === prestadorId);
    if (!currentPrestador) return;
    
    // Preencher dados do prestador
    document.getElementById('prestadorNome').textContent = currentPrestador.nome;
    document.getElementById('prestadorCategoria').textContent = currentPrestador.categoria_nome;
    document.getElementById('prestadorDescricao').textContent = currentPrestador.descricao;
    document.getElementById('prestadorStars').innerHTML = generateStars(currentPrestador.media_rank);
    document.getElementById('prestadorRatingText').textContent = `${currentPrestador.media_rank.toFixed(1)} (${currentPrestador.total_avaliacoes} avaliações)`;
    
    // Configurar botão do WhatsApp
    const whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn) {
        whatsappBtn.onclick = () => {
            window.open(generateWhatsAppLink(currentPrestador.telefone_whatsapp, currentPrestador.nome), '_blank');
        };
    }
    
    // Mostrar/esconder botão de avaliar
    const avaliarBtn = document.getElementById('avaliarBtn');
    if (currentUser && avaliarBtn) {
        avaliarBtn.classList.remove('hidden');
        avaliarBtn.onclick = () => {
            closeModal('prestadorModal');
            openModal('ratingModal');
        };
    }
    
    // Carregar avaliações
    await loadAvaliacoes(prestadorId);
    
    openModal('prestadorModal');
}

async function loadAvaliacoes(prestadorId) {
    try {
        const { data: avaliacoes } = await supabaseClient
            .from('avaliacoes')
            .select('*')
            .eq('prestador_id', prestadorId)
            .order('created_at', { ascending: false });
        
        const avaliacoesList = document.getElementById('avaliacoesList');
        if (!avaliacoesList) return;
        
        if (!avaliacoes || avaliacoes.length === 0) {
            avaliacoesList.innerHTML = '<p>Ainda não há avaliações para este prestador.</p>';
            return;
        }
        
        const avaliacoesHTML = avaliacoes.map(avaliacao => `
            <div class="avaliacao-item">
                <div class="avaliacao-header">
                    <div class="avaliacao-stars">${generateStars(avaliacao.nota)}</div>
                    <span class="avaliacao-date">${formatDate(avaliacao.created_at)}</span>
                </div>
                ${avaliacao.comentario ? `<p class="avaliacao-comentario">${avaliacao.comentario}</p>` : ''}
            </div>
        `).join('');
        
        avaliacoesList.innerHTML = avaliacoesHTML;
        
    } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
    }
}

// Rating functionality
function setupRatingStars() {
    const ratingStars = document.querySelectorAll('#ratingInput .star');
    let selectedRating = 0;
    
    ratingStars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            updateRatingDisplay(selectedRating);
        });
        
        star.addEventListener('mouseenter', () => {
            updateRatingDisplay(index + 1);
        });
    });
    
    document.getElementById('ratingInput').addEventListener('mouseleave', () => {
        updateRatingDisplay(selectedRating);
    });
    
    function updateRatingDisplay(rating) {
        ratingStars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
}

async function handleRating(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Você precisa fazer login para avaliar', 'error');
        return;
    }
    
    if (!currentPrestador) {
        showToast('Erro: prestador não encontrado', 'error');
        return;
    }
    
    const rating = document.querySelectorAll('#ratingInput .star.active').length;
    const comentario = document.getElementById('ratingComentario')?.value;
    
    if (rating === 0) {
        showToast('Selecione uma avaliação', 'error');
        return;
    }
    
    try {
        // Inserir avaliação
        await supabaseClient.from('avaliacoes').insert({
            prestador_id: currentPrestador.id,
            contratante_id: currentUser.id,
            nota: rating,
            comentario: comentario || null
        });
        
        showToast('Avaliação enviada com sucesso!', 'success');
        closeModal('ratingModal');
        elements.ratingForm?.reset();
        
        // Resetar stars
        document.querySelectorAll('#ratingInput .star').forEach(star => {
            star.classList.remove('active');
        });
        
        // Recarregar prestadores para atualizar média
        await loadPrestadores();
        
    } catch (error) {
        console.error('Erro ao enviar avaliação:', error);
        showToast('Erro ao enviar avaliação. Tente novamente.', 'error');
    }
}

// UI updates
function updateUIForLoggedUser() {
    elements.loginBtn?.classList.add('hidden');
    elements.cadastroBtn?.classList.add('hidden');
    elements.perfilBtn?.classList.remove('hidden');
    elements.logoutBtn?.classList.remove('hidden');
}

function updateUIForLoggedOut() {
    elements.loginBtn?.classList.remove('hidden');
    elements.cadastroBtn?.classList.remove('hidden');
    elements.perfilBtn?.classList.add('hidden');
    elements.logoutBtn?.classList.add('hidden');
}

// Toast notifications
function showToast(message, type = 'info') {
    if (!elements.toast || !elements.toastMessage) return;
    
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        hideToast();
    }, 5000);
}

function hideToast() {
    elements.toast?.classList.remove('show');
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Carousel functions
function initializeCarousel() {
    // Start automatic carousel
    startCarouselInterval();
    
    // Pause on hover
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            clearInterval(carouselInterval);
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            startCarouselInterval();
        });
    }
}

function startCarouselInterval() {
    carouselInterval = setInterval(() => {
        changeSlide((currentSlide + 1) % totalSlides);
    }, 5000); // 5 segundos
}

function resetCarouselInterval() {
    clearInterval(carouselInterval);
    startCarouselInterval();
}

function changeSlide(newSlide) {
    // Normalize slide index
    if (newSlide < 0) {
        newSlide = totalSlides - 1;
    } else if (newSlide >= totalSlides) {
        newSlide = 0;
    }
    
    // Update slides
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    // Remove active classes
    slides[currentSlide]?.classList.remove('active');
    indicators[currentSlide]?.classList.remove('active');
    
    // Add previous class for animation
    slides[currentSlide]?.classList.add('prev');
    
    // Update current slide
    currentSlide = newSlide;
    
    // Add active classes
    slides[currentSlide]?.classList.add('active');
    indicators[currentSlide]?.classList.add('active');
    
    // Remove previous classes after animation
    setTimeout(() => {
        slides.forEach(slide => slide.classList.remove('prev'));
    }, 600);
}

// Função para testar conexão com Supabase
async function testSupabaseConnection() {
    try {
        showToast('🔍 Testando conexão com Supabase...', 'info');
        
        const { data, error } = await supabaseClient.from('categorias').select('count', { count: 'exact' });
        
        if (error) {
            throw error;
        }
        
        showToast(`✅ Conexão OK! ${data.length} categorias encontradas`, 'success');
        console.log('✅ Teste de conexão bem-sucedido:', data);
        
    } catch (error) {
        console.error('❌ Erro no teste de conexão:', error);
        showToast(`❌ Erro: ${error.message}`, 'error');
    }
}

// Expose functions to global scope for onclick handlers
window.openPrestadorModal = openPrestadorModal;
window.testSupabaseConnection = testSupabaseConnection;
