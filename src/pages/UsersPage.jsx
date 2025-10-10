// src/pages/UsersPage.jsx
import React, { useState } from "react";
import "./UsersPage.css";
import UserRegisterModal from "./UserRegisterModal.jsx";


const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Dados mockados de usuários
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Amelia Santos Andrade",
      email: "amelia.santos@email.com",
      role: "administrador",
      status: "ativo",
      phone: "(98) 9 8787-9090",
      lastAccess: "2024-01-15 14:30",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      createdAt: "2024-01-10",
    },
    {
      id: 2,
      name: "Vicente Santos",
      email: "vicente.santos@email.com",
      role: "recepcionista",
      status: "ativo",
      phone: "(98) 9 8787-9090",
      lastAccess: "2024-01-14 09:15",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      createdAt: "2024-01-12",
    },
    {
      id: 3,
      name: "Maria Oliveira",
      email: "maria.oliveira@email.com",
      role: "gerente",
      status: "inativo",
      phone: "(11) 9 9999-8888",
      lastAccess: "2024-01-10 16:45",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      createdAt: "2024-01-08",
    },
    {
      id: 3,
      name: "Mario Oliveira Nunes",
      email: "maria.oliveira@email.com",
      role: "camareiro",
      status: "inativo",
      phone: "(11) 9 9999-8888",
      lastAccess: "2024-01-10 16:45",
      avatar: "https://randomuser.me/api/portraits/men/44.jpg",
      createdAt: "2024-01-08",
    },
  ]);

  const statusConfig = {
    ativo: { label: "Ativo", color: "#22c55e" },
    inativo: { label: "Inativo", color: "#ef4444" },
    pendente: { label: "Pendente", color: "#f59e0b" },
  };

  const roleConfig = {
    administrador: { label: "Administrador", color: "#8b5cf6" },
    gerente: { label: "Gerente", color: "#3b82f6" },
    recepcionista: { label: "Recepcionista", color: "#06b6d4" },
    camareiro: { label: "Camareiro", color: "#10b981" },
  };

  const filterConfig = {
    todos: { label: "Todos", color: "gray" },
    hospedados: { label: "Hospedados", color: "green" },
    bloqueados: { label: "Bloqueados", color: "red" },
    administradores: { label: "Administradores", color: "purple" },
    recepcionistas: { label: "Recepcionistas", color: "blue" },
  };

  // Filtragem e contagem
  const { filteredUsers, filters } = React.useMemo(() => {
    const counts = {
      todos: { ...filterConfig.todos, count: 0 },
      hospedados: { ...filterConfig.hospedados, count: 0 },
      bloqueados: { ...filterConfig.bloqueados, count: 0 },
      administradores: { ...filterConfig.administradores, count: 0 },
      recepcionistas: { ...filterConfig.recepcionistas, count: 0 },
    };

    // Contagem por status e função
    users.forEach((user) => {
      counts.todos.count++;
      if (user.status === "hospedados") counts.hospedados.count++;
      if (user.status === "bloqueados") counts.bloqueados.count++;
      if (user.role === "administrador") counts.administradores.count++;
      if (user.role === "recepcionista") counts.recepcionistas.count++;
    });

    let filtered = users;

    // Aplicar filtro ativo
    if (activeFilter !== "todos") {
      filtered = users.filter((user) => {
        switch (activeFilter) {
          case "hospedados":
            return user.status === "hospedados";
          case "bloqueados":
            return user.status === "bloqueados";
          case "administradores":
            return user.role === "administrador";
          case "recepcionistas":
            return user.role === "recepcionista";
          default:
            return true;
        }
      });
    }

    // Aplicar busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.phone.includes(searchTerm.replace(/\D/g, ""))
      );
    }

    return { filteredUsers: filtered, filters: counts };
  }, [users, activeFilter, searchTerm]);

  const openModal = (user = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = (userData) => {
    if (userData.id) {
      // Editar usuário existente
      setUsers((prev) =>
        prev.map((u) => (u.id === userData.id ? userData : u))
      );
    } else {
      // Adicionar novo usuário
      const newUser = {
        ...userData,
        id: Math.max(...users.map((u) => u.id)) + 1,
        createdAt: new Date().toISOString().split("T")[0],
        lastAccess: "",
      };
      setUsers((prev) => [...prev, newUser]);
    }
    handleCloseModal();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Nunca";
    const date = new Date(dateTimeString);
    return date.toLocaleString("pt-BR");
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1 className="users-title">Clientes</h1>
        <button className="add-button" onClick={() => openModal()}>
          <span className="add-icon">+</span> Adicionar Usuário
        </button>
      </div>
      <div className="users-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      <div className="filter-tabs">
        {Object.entries(filters).map(([key, config]) => (
          <button
            key={key}
            className={`filter-tab ${activeFilter === key ? "active" : ""} ${
              config.color
            }`}
            onClick={() => setActiveFilter(key)}
          >
            {config.label}
            <span className="filter-count">{config.count || 0}</span>
          </button>
        ))}
      </div>
      <div className="users-content">
        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <p>Nenhum usuário encontrado.</p>
              <button className="add-button" onClick={() => openModal()}>
                <span className="add-icon">+</span> Adicionar Primeiro Usuário
              </button>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const statusCfg = statusConfig[user.status] || {
                label: "Desconhecido",
                color: "#9ca3af",
              };
              const roleCfg = roleConfig[user.role] || {
                label: user.role,
                color: "#6b7280",
              };

              return (
                <div key={user.id} className="user-card">
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-fallback">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </div>

                  <div className="user-info">
                    <div className="user-main">
                      <h3 className="user-name">{user.name}</h3>
                      <p className="user-email">{user.email}</p>
                    </div>
                    <div className="user-details">
                      <p className="user-phone">{user.phone}</p>
                      <p className="user-created">
                        Cadastrado em: {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="user-roles">
                    <span
                      className="role-tag"
                      style={{ backgroundColor: roleCfg.color }}
                    >
                      {roleCfg.label}
                    </span>
                    <span
                      className="status-tag"
                      style={{ backgroundColor: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="user-last-access">
                    <div className="last-access-label">Último Acesso</div>
                    <div className="last-access-value">
                      {formatDateTime(user.lastAccess)}
                    </div>
                  </div>

                  <div className="user-actions">
                    <button
                      className="action-button edit"
                      onClick={() => openModal(user)}
                    >
                      Visualizar
                    </button>
                    
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Modal de Cadastro/Edição */}
      // ...
      {isModalOpen && (
        <UserRegisterModal
          user={selectedUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

// Componente Modal para Cadastro/Edição
const UserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: user?.id || "",
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "recepcionista",
    status: user?.status || "ativo",
    avatar: user?.avatar || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content user-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <span className="user-icon">👤</span>
            <span>{user ? "Editar Usuário" : "Cadastrar Usuário"}</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-section">
            <h3>Informações Pessoais</h3>

            <div className="form-row">
              <div className="form-field">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div className="form-field">
                <label>Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(00) 0 0000-0000"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Função *</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  required
                >
                  <option value="recepcionista">Recepcionista</option>
                  <option value="gerente">Gerente</option>
                  <option value="administrador">Administrador</option>
                  <option value="limpeza">Limpeza</option>
                </select>
              </div>
              <div className="form-field">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  required
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>URL do Avatar (opcional)</label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => handleChange("avatar", e.target.value)}
                  placeholder="https://exemplo.com/avatar.jpg"
                />
              </div>
            </div>
          </div>

          {!user && (
            <div className="form-section">
              <h3>Credenciais de Acesso</h3>
              <div className="form-notice">
                <span className="notice-icon">ℹ️</span>
                <span>
                  As credenciais de acesso serão enviadas por email para o
                  usuário.
                </span>
              </div>
            </div>
          )}
        </form>

        <div className="modal-footer">
          <button className="cancel-btn" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="save-btn" type="submit" onClick={handleSubmit}>
            {user ? "Salvar Alterações" : "Cadastrar Usuário"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Exportação correta
export { UsersPage };
