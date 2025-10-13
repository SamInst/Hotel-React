// src/pages/UsersPage.jsx
import React, { useState } from "react";
import "./UsersPage.css";
import UserRegisterModal from "./UserRegisterModal.jsx";
import CompanyRegisterModal from "./CompanyRegisterModal.jsx";
import VehicleRegisterModal from "./VehicleRegisterModal.jsx";

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("recem_cadastrados");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Dados mockados de pessoas
  const [pessoas, setPessoas] = useState([
    {
      id: 1,
      name: "Amelia Santos Andrade",
      email: "amelia.santos@email.com",
      tipo: "hospede",
      status: "recem_cadastrado",
      phone: "(98) 9 8787-9090",
      lastAccess: "2024-01-15 14:30",
      lastStay: "2024-01-10",
      createdAt: "2024-01-10",
    },
    {
      id: 2,
      name: "Vicente Santos",
      email: "vicente.santos@email.com",
      tipo: "hospede",
      status: "hospedado",
      phone: "(98) 9 8787-9090",
      lastAccess: "2024-01-14 09:15",
      lastStay: "2024-01-14",
      createdAt: "2024-01-12",
    },
    {
      id: 3,
      name: "Maria Oliveira",
      email: "maria.oliveira@email.com",
      tipo: "hospede",
      status: "bloqueado",
      phone: "(11) 9 9999-8888",
      lastAccess: "2024-01-10 16:45",
      lastStay: "2023-12-20",
      createdAt: "2024-01-08",
    },
    {
      id: 4,
      name: "Mario Oliveira Nunes",
      email: "mario.oliveira@email.com",
      tipo: "hospede",
      status: "hospedado",
      phone: "(11) 9 9999-8888",
      lastAccess: "2024-01-10 16:45",
      lastStay: "2024-01-09",
      createdAt: "2024-01-08",
    },
    {
      id: 5,
      name: "João Silva Santos",
      email: "joao.silva@email.com",
      tipo: "funcionario",
      role: "recepcionista",
      status: "recem_cadastrado",
      phone: "(98) 9 8888-7777",
      lastAccess: "2024-01-16 10:00",
      createdAt: "2024-01-15",
    },
    {
      id: 6,
      name: "Ana Paula Costa",
      email: "ana.costa@email.com",
      tipo: "funcionario",
      role: "gerente",
      status: "recem_cadastrado",
      phone: "(98) 9 7777-6666",
      lastAccess: "2024-01-16 08:30",
      createdAt: "2024-01-14",
    },
  ]);

  // Dados mockados de empresas
  const [empresas, setEmpresas] = useState([
    {
      id: 1,
      name: "Tech Solutions LTDA",
      razao_social: "Tech Solutions Tecnologia LTDA",
      cnpj: "12.345.678/0001-90",
      tipo: "empresa",
      status: "recem_cadastrado",
      phone: "(11) 3000-0000",
      email: "contato@techsolutions.com.br",
      createdAt: "2024-01-12",
      pessoas_vinculadas: [1, 2],
    },
    {
      id: 2,
      name: "Distribuidora ABC S/A",
      razao_social: "ABC Distribuição e Comércio S/A",
      cnpj: "98.765.432/0001-10",
      tipo: "empresa",
      status: "recem_cadastrado",
      phone: "(11) 4000-0000",
      email: "contato@distribuidoraabc.com.br",
      createdAt: "2024-01-13",
      pessoas_vinculadas: [3],
    },
  ]);

  // Dados mockados de veículos
  const [veiculos, setVeiculos] = useState([
    {
      id: 1,
      name: "Toyota Corolla - ABC-1234",
      placa: "ABC-1234",
      marca: "Toyota",
      modelo: "Corolla",
      tipo: "veiculo",
      status: "recem_cadastrado",
      createdAt: "2024-01-14",
      proprietario_id: 1,
      proprietario_nome: "Amelia Santos Andrade",
    },
    {
      id: 2,
      name: "Honda Civic - XYZ-5678",
      placa: "XYZ-5678",
      marca: "Honda",
      modelo: "Civic",
      tipo: "veiculo",
      status: "recem_cadastrado",
      createdAt: "2024-01-15",
      proprietario_id: 2,
      proprietario_nome: "Vicente Santos",
    },
    {
      id: 3,
      name: "Ford Ranger - DEF-9012",
      placa: "DEF-9012",
      marca: "Ford",
      modelo: "Ranger",
      tipo: "veiculo",
      status: "recem_cadastrado",
      createdAt: "2024-01-16",
      proprietario_id: 4,
      proprietario_nome: "Mario Oliveira Nunes",
    },
  ]);

  const statusConfig = {
    recem_cadastrado: { label: "Recém Cadastrado", color: "#f59e0b" },
    hospedado: { label: "Hospedado", color: "#22c55e" },
    bloqueado: { label: "Bloqueado", color: "#ef4444" },
  };

  const roleConfig = {
    recepcionista: { label: "Recepcionista", color: "#06b6d4" },
    gerente: { label: "Gerente", color: "#3b82f6" },
    administrador: { label: "Administrador", color: "#8b5cf6" },
    camareiro: { label: "Camareiro", color: "#10b981" },
  };

  const filterConfig = {
    recem_cadastrados: { label: "Recém Cadastrados", color: "orange" },
    hospedados: { label: "Hospedados", color: "green" },
    bloqueados: { label: "Bloqueados", color: "red" },
    empresas: { label: "Empresas", color: "blue" },
    veiculos: { label: "Veículos", color: "purple" },
    funcionarios: { label: "Funcionários", color: "teal" },
  };

  // Combinar todos os dados
  const allItems = [...pessoas, ...empresas, ...veiculos];

  // Filtragem e contagem
  const { filteredItems, filters } = React.useMemo(() => {
    const counts = {
      recem_cadastrados: { ...filterConfig.recem_cadastrados, count: 0 },
      hospedados: { ...filterConfig.hospedados, count: 0 },
      bloqueados: { ...filterConfig.bloqueados, count: 0 },
      empresas: { ...filterConfig.empresas, count: 0 },
      veiculos: { ...filterConfig.veiculos, count: 0 },
      funcionarios: { ...filterConfig.funcionarios, count: 0 },
    };

    allItems.forEach((item) => {
      if (item.status === "recem_cadastrado") counts.recem_cadastrados.count++;
      if (item.status === "hospedado") counts.hospedados.count++;
      if (item.status === "bloqueado") counts.bloqueados.count++;
      if (item.tipo === "empresa") counts.empresas.count++;
      if (item.tipo === "veiculo") counts.veiculos.count++;
      if (item.tipo === "funcionario") counts.funcionarios.count++;
    });

    let filtered = allItems;

    if (activeFilter !== "recem_cadastrados" || searchTerm) {
      filtered = allItems.filter((item) => {
        let matchFilter = true;

        switch (activeFilter) {
          case "recem_cadastrados":
            matchFilter = item.status === "recem_cadastrado";
            break;
          case "hospedados":
            matchFilter = item.status === "hospedado";
            break;
          case "bloqueados":
            matchFilter = item.status === "bloqueado";
            break;
          case "empresas":
            matchFilter = item.tipo === "empresa";
            break;
          case "veiculos":
            matchFilter = item.tipo === "veiculo";
            break;
          case "funcionarios":
            matchFilter = item.tipo === "funcionario";
            break;
          default:
            matchFilter = true;
        }

        if (!matchFilter) return false;

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            item.name?.toLowerCase().includes(term) ||
            item.email?.toLowerCase().includes(term) ||
            item.phone?.includes(searchTerm.replace(/\D/g, "")) ||
            item.placa?.toLowerCase().includes(term) ||
            item.cnpj?.includes(searchTerm.replace(/\D/g, ""))
          );
        }

        return true;
      });
    }

    return { filteredItems: filtered, filters: counts };
  }, [allItems, activeFilter, searchTerm]);

  const openUserModal = (user = null) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = (userData) => {
    if (userData.id) {
      setPessoas((prev) =>
        prev.map((u) => (u.id === userData.id ? { ...u, ...userData } : u))
      );
    } else {
      const newUser = {
        ...userData,
        id: Math.max(...pessoas.map((u) => u.id), 0) + 1,
        tipo: "hospede",
        status: "recem_cadastrado",
        createdAt: new Date().toISOString().split("T")[0],
        lastAccess: "",
      };
      setPessoas((prev) => [...prev, newUser]);
    }
    handleCloseUserModal();
  };

  const handleSaveCompany = (companyData) => {
    if (companyData.id) {
      setEmpresas((prev) =>
        prev.map((c) => (c.id === companyData.id ? { ...c, ...companyData } : c))
      );
    } else {
      const newCompany = {
        ...companyData,
        id: Math.max(...empresas.map((e) => e.id), 0) + 1,
        name: companyData.nome_fantasia || companyData.razao_social,
        tipo: "empresa",
        status: "recem_cadastrado",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setEmpresas((prev) => [...prev, newCompany]);
    }
    setIsCompanyModalOpen(false);
  };

  const handleSaveVehicle = (vehicleData) => {
    if (vehicleData.id) {
      setVeiculos((prev) =>
        prev.map((v) => (v.id === vehicleData.id ? { ...v, ...vehicleData } : v))
      );
    } else {
      const proprietario = pessoas.find(
        (p) => p.id === parseInt(vehicleData.proprietario_id)
      );
      const newVehicle = {
        ...vehicleData,
        id: Math.max(...veiculos.map((v) => v.id), 0) + 1,
        name: `${vehicleData.marca} ${vehicleData.modelo} - ${vehicleData.placa}`,
        tipo: "veiculo",
        status: "recem_cadastrado",
        createdAt: new Date().toISOString().split("T")[0],
        proprietario_nome: proprietario?.name || "",
      };
      setVeiculos((prev) => [...prev, newVehicle]);
    }
    setIsVehicleModalOpen(false);
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

  const renderCard = (item) => {
    const statusCfg = statusConfig[item.status] || {
      label: "Desconhecido",
      color: "#9ca3af",
    };

    // Card para Empresa
    if (item.tipo === "empresa") {
      return (
        <div key={item.id} className="user-card">
          <div className="user-avatar">
            <div className="avatar-fallback company">🏢</div>
          </div>

          <div className="user-info">
            <div className="user-main">
              <h3 className="user-name">{item.name}</h3>
              <p className="user-email">{item.cnpj}</p>
            </div>
            <div className="user-details">
              <p className="user-phone">{item.phone}</p>
              <p className="user-created">
                Cadastrado em: {formatDate(item.createdAt)}
              </p>
            </div>
          </div>

          <div className="user-roles">
            <span className="role-tag" style={{ backgroundColor: "#3b82f6" }}>
              Empresa
            </span>
            <span
              className="status-tag"
              style={{ backgroundColor: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
          </div>

          <div className="user-last-access">
            <div className="last-access-label">Pessoas Vinculadas</div>
            <div className="last-access-value">
              {item.pessoas_vinculadas?.length || 0}
            </div>
          </div>

          <div className="user-actions">
            <button className="action-button edit" onClick={() => {}}>
              Visualizar
            </button>
          </div>
        </div>
      );
    }

    // Card para Veículo
    if (item.tipo === "veiculo") {
      return (
        <div key={item.id} className="user-card">
          <div className="user-avatar">
            <div className="avatar-fallback vehicle">🚗</div>
          </div>

          <div className="user-info">
            <div className="user-main">
              <h3 className="user-name">{item.name}</h3>
              <p className="user-email">{item.proprietario_nome}</p>
            </div>
            <div className="user-details">
              <p className="user-phone">
                {item.marca} {item.modelo}
              </p>
              <p className="user-created">
                Cadastrado em: {formatDate(item.createdAt)}
              </p>
            </div>
          </div>

          <div className="user-roles">
            <span className="role-tag" style={{ backgroundColor: "#8b5cf6" }}>
              Veículo
            </span>
            <span
              className="status-tag"
              style={{ backgroundColor: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
          </div>

          <div className="user-last-access">
            <div className="last-access-label">Placa</div>
            <div className="last-access-value">{item.placa}</div>
          </div>

          <div className="user-actions">
            <button className="action-button edit" onClick={() => {}}>
              Visualizar
            </button>
          </div>
        </div>
      );
    }

    // Card para Pessoa (Hóspede/Funcionário)
    const roleCfg = item.role ? roleConfig[item.role] : null;
    
    // Determinar o que mostrar na seção de informação adicional
    let infoLabel = "Último Acesso";
    let infoValue = formatDateTime(item.lastAccess);
    
    if (item.tipo === "hospede") {
      infoLabel = "Última Hospedagem";
      infoValue = item.lastStay ? formatDate(item.lastStay) : "Nunca hospedado";
    } else if (item.tipo === "funcionario") {
      infoLabel = "Último Acesso";
      infoValue = formatDateTime(item.lastAccess);
    }

    return (
      <div key={item.id} className="user-card">
        <div className="user-avatar">
          <div className="avatar-fallback">{getInitials(item.name)}</div>
        </div>

        <div className="user-info">
          <div className="user-main">
            <h3 className="user-name">{item.name}</h3>
            <p className="user-email">{item.email}</p>
          </div>
          <div className="user-details">
            <p className="user-phone">{item.phone}</p>
            <p className="user-created">
              Cadastrado em: {formatDate(item.createdAt)}
            </p>
          </div>
        </div>

        <div className="user-roles">
          {roleCfg && (
            <span
              className="role-tag"
              style={{ backgroundColor: roleCfg.color }}
            >
              {roleCfg.label}
            </span>
          )}
          {item.tipo === "hospede" && (
            <span className="role-tag" style={{ backgroundColor: "#10b981" }}>
              Hóspede
            </span>
          )}
          <span
            className="status-tag"
            style={{ backgroundColor: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>

        <div className="user-last-access">
          <div className="last-access-label">{infoLabel}</div>
          <div className="last-access-value">
            {infoValue}
          </div>
        </div>

        <div className="user-actions">
          <button
            className="action-button edit"
            onClick={() => openUserModal(item)}
          >
            Visualizar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1 className="users-title">Cadastro de Hóspedes, Empresas e Veículos</h1>
        <div className="header-actions">
          <button className="add-button" onClick={() => openUserModal()}>
            <span className="add-icon">+</span> Cadastrar Hóspede
          </button>
          <button
            className="add-button secondary"
            onClick={() => setIsCompanyModalOpen(true)}
          >
            <span className="add-icon">+</span> Cadastrar Empresa
          </button>
          <button
            className="add-button secondary"
            onClick={() => setIsVehicleModalOpen(true)}
          >
            <span className="add-icon">+</span> Cadastrar Veículo
          </button>
        </div>
      </div>
      <div className="users-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nome, email, telefone, placa ou CNPJ..."
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
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <p>Nenhum registro encontrado.</p>
              <button className="add-button" onClick={() => openUserModal()}>
                <span className="add-icon">+</span> Cadastrar Primeiro Registro
              </button>
            </div>
          ) : (
            filteredItems.map(renderCard)
          )}
        </div>
      </div>

      {isUserModalOpen && (
        <UserRegisterModal
          user={selectedUser}
          onClose={handleCloseUserModal}
          onSave={handleSaveUser}
        />
      )}

      {isCompanyModalOpen && (
        <CompanyRegisterModal
          pessoas={pessoas.filter((p) => p.tipo === "hospede")}
          onClose={() => setIsCompanyModalOpen(false)}
          onSave={handleSaveCompany}
        />
      )}

      {isVehicleModalOpen && (
        <VehicleRegisterModal
          pessoas={pessoas.filter((p) => p.tipo === "hospede")}
          onClose={() => setIsVehicleModalOpen(false)}
          onSave={handleSaveVehicle}
        />
      )}
    </div>
  );
};

export { UsersPage };