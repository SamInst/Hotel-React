// src/pages/UserRegisterModal.jsx
import React, { useState, useEffect } from "react";
import InputMask from "react-input-mask";
import "./UserRegisterModal.css";
import {
  buscarEnderecoPorCep,
  listarPaises,
  listarEstados,
  listarMunicipios,
} from "../services/enderecoService";
import SingleDatePicker from "../components/SingleDatePicker.jsx";
import { useUIFeedback, LoadingOverlay, Toasts } from "../config/uiUtilities";

const UserRegisterModal = ({ user, onClose, onSave }) => {
  const {
    loading,
    loadingMessage,
    executeWithFeedback,
    toasts,
    closeToast,
    notifySuccess,
    notifyError,
  } = useUIFeedback();

  const [editing, setEditing] = useState(!user); // Se não tem user, está criando (editing = true)
  const [form, setForm] = useState({
    nome: "",
    data_nascimento: "",
    cpf: "",
    rg: "",
    email: "",
    telefone: "",
    fk_pais: "",
    fk_estado: "",
    fk_municipio: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    sexo: "",
  });

  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [cpfStatus, setCpfStatus] = useState(null); // null | 'disponivel' | 'cadastrado'

  // Carregar países/estados na abertura
  useEffect(() => {
    listarPaises()
      .then(setPaises)
      .catch(() => setPaises([]));
    listarEstados()
      .then(setEstados)
      .catch(() => setEstados([]));
  }, []);

  // Carregar dados do usuário se existir
  useEffect(() => {
    if (user) {
      console.log("Carregando dados do usuário:", user);
      setForm({
        nome: user.nome || user.name || "",
        data_nascimento: user.data_nascimento || "",
        cpf: user.cpf || "",
        rg: user.rg || "",
        email: user.email || "",
        telefone: user.telefone || user.phone || "",
        fk_pais: user.fk_pais || "",
        fk_estado: user.fk_estado || "",
        fk_municipio: user.fk_municipio || "",
        cep: user.cep || "",
        endereco: user.endereco || "",
        numero: user.numero || "",
        complemento: user.complemento || "",
        bairro: user.bairro || "",
        sexo: user.sexo || "",
      });
      setEditing(false);
    }
  }, [user]);

  // Atualiza lista de municípios conforme estado selecionado
  useEffect(() => {
    if (form.fk_estado) {
      listarMunicipios(form.fk_estado)
        .then(setMunicipios)
        .catch(() => setMunicipios([]));
    }
  }, [form.fk_estado]);

  // Função utilitária para normalizar textos (remove acentos e deixa minúsculo)
  const normalize = (str) =>
    str
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim() || "";

  // Debounce global para evitar múltiplas buscas seguidas
  let cepTimeout = null;

  const handleBuscarCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return; // só busca com 8 dígitos completos

    if (cepTimeout) clearTimeout(cepTimeout);

    cepTimeout = setTimeout(async () => {
      await executeWithFeedback(
        async () => {
          const endereco = await buscarEnderecoPorCep(cleanCep);
          if (!endereco) {
            notifyError("CEP não encontrado.");
            return;
          }

          const ufSigla = endereco.uf;
          const cidadeNome = endereco.localidade;

          // Busca estados do país Brasil (id=1)
          const estadosData = await listarEstados(1);

          // Encontra estado pelo nome ou sigla
          const estadoEncontrado = estadosData.find(
            (e) =>
              normalize(e.nome) === normalize(endereco.estado) ||
              normalize(e.sigla || "") === normalize(ufSigla)
          );

          let municipioEncontrado = null;

          // Busca municípios apenas se o estado foi encontrado
          if (estadoEncontrado) {
            const municipiosData = await listarMunicipios(estadoEncontrado.id);

            municipioEncontrado = municipiosData.find(
              (m) => normalize(m.nome) === normalize(cidadeNome)
            );
          }

          // Atualiza o formulário com os dados do endereço
          setForm((prev) => ({
            ...prev,
            endereco: endereco.logradouro || "",
            bairro: endereco.bairro || "",
            complemento: endereco.complemento || "",
            fk_pais: 1, // Brasil padrão
            fk_estado: estadoEncontrado?.id || "",
            fk_municipio: municipioEncontrado?.id || "",
          }));

          if (estadoEncontrado && municipioEncontrado) {
            notifySuccess("Endereço preenchido automaticamente!");
          } else if (estadoEncontrado && !municipioEncontrado) {
            notifyError(
              `Estado encontrado, mas município não localizado (${cidadeNome}).`
            );
          } else {
            notifyError(
              "Não foi possível identificar o estado/município do CEP."
            );
          }
        },
        {
          loadingMessage: "Buscando endereço...",
          errorPrefix: "Erro ao buscar CEP",
        }
      );
    }, 500); // aguarda 500ms após o último dígito
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Limpa o status do CPF se o usuário modificar o campo
    if (field === "cpf") {
      setCpfStatus(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const handleCancel = () => {
    if (user) {
      // Restaurar dados originais
      setForm({
        nome: user.nome || user.name || "",
        data_nascimento: user.data_nascimento || "",
        cpf: user.cpf || "",
        rg: user.rg || "",
        email: user.email || "",
        telefone: user.telefone || user.phone || "",
        fk_pais: user.fk_pais || "",
        fk_estado: user.fk_estado || "",
        fk_municipio: user.fk_municipio || "",
        cep: user.cep || "",
        endereco: user.endereco || "",
        numero: user.numero || "",
        complemento: user.complemento || "",
        bairro: user.bairro || "",
        sexo: user.sexo || "",
      });
      setEditing(false);
    } else {
      onClose();
    }
  };

  const getPaisNome = (id) => {
    if (!id) return "—";
    const pais = paises.find((p) => String(p.id) === String(id));
    return pais?.nome || "—";
  };

  const getEstadoNome = (id) => {
    if (!id) return "—";
    const estado = estados.find((e) => String(e.id) === String(id));
    return estado?.nome || "—";
  };

  const getMunicipioNome = (id) => {
    if (!id) return "—";
    const municipio = municipios.find((m) => String(m.id) === String(id));
    return municipio?.nome || "—";
  };

  const getSexoLabel = (sexo) => {
    if (sexo === "1" || sexo === 1) return "Masculino";
    if (sexo === "2" || sexo === 2) return "Feminino";
    return "—";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return "—";
    }
  };

  // Mock de verificação de CPF - substituir pelo endpoint real
  const verificarCpfCadastrado = async (cpf) => {
    // Simula uma chamada à API
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock: considera alguns CPFs como já cadastrados
    const cpfsCadastrados = [
      "12345678909",
      "98765432100",
      "11122233344",
    ];

    return cpfsCadastrados.includes(cpf);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {user
              ? editing
                ? "Editar Pessoa"
                : "Dados Pessoais"
              : "Cadastrar Pessoa"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid grid-3">
            <div className="detail-item">
              <label>Nome Completo *</label>
              {editing ? (
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  placeholder="Nome completo"
                />
              ) : (
                <span className="detail-value">{form.nome || "—"}</span>
              )}
            </div>
            <div className="detail-item">
              <label>Data de Nascimento</label>
              {editing ? (
                <div style={{ width: '100%' }}>
                  <SingleDatePicker
                    value={form.data_nascimento}
                    onChange={(iso) => handleChange("data_nascimento", iso)}
                    placeholder="—"
                    maxDate={new Date()} // bloqueia datas futuras
                  />
                </div>
              ) : (
                <span className="detail-value">
                  {formatDate(form.data_nascimento)}
                </span>
              )}
            </div>

            <div className="detail-item">
              <label>Sexo</label>
              {editing ? (
                <select
                  value={form.sexo}
                  onChange={(e) => handleChange("sexo", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="1">Masculino</option>
                  <option value="2">Feminino</option>
                </select>
              ) : (
                <span className="detail-value">{getSexoLabel(form.sexo)}</span>
              )}
            </div>
          </div>

          <div className="form-grid grid-3">
            <div className="detail-item">
              <label>CPF *</label>
              {editing ? (
                <>
                  <InputMask
                    className="mask-input"
                    mask="999.999.999-99"
                    value={form.cpf}
                    onChange={async (e) => {
                      const cpfValue = e.target.value;
                      handleChange("cpf", cpfValue);

                      const clean = cpfValue.replace(/\D/g, "");
                      if (clean.length === 11) {
                        await executeWithFeedback(
                          async () => {
                            // Verifica se o CPF já está cadastrado
                            const jaCadastrado = await verificarCpfCadastrado(clean);
                            setCpfStatus(jaCadastrado ? "cadastrado" : "disponivel");

                            if (jaCadastrado) {
                              notifyError("Este CPF já está cadastrado no sistema!");
                            } else {
                              notifySuccess("CPF disponível para cadastro!");
                            }
                          },
                          {
                            loadingMessage: "Verificando CPF...",
                            errorPrefix: "Erro na verificação",
                          }
                        );
                      }
                    }}
                    required
                    placeholder="000.000.000-00"
                  />

                  {/* Indicador de status do CPF */}
                  {cpfStatus && (
                    <div className={`cnpj-status cnpj-status--${cpfStatus}`}>
                      {cpfStatus === "disponivel" ? (
                        <>
                          <span className="status-icon">✓</span>
                          <span>CPF disponível para cadastro</span>
                        </>
                      ) : (
                        <>
                          <span className="status-icon">⚠</span>
                          <span>CPF já cadastrado no sistema</span>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <span className="detail-value">{form.cpf || "—"}</span>
              )}
            </div>
            <div className="detail-item">
              <label>RG</label>
              {editing ? (
                <InputMask
                  className="mask-input"
                  mask="99.999.999-9"
                  value={form.rg}
                  onChange={(e) => handleChange("rg", e.target.value)}
                  placeholder="00.000.000-0"
                />
              ) : (
                <span className="detail-value">{form.rg || "—"}</span>
              )}
            </div>
            <div className="detail-item">
              <label>Telefone</label>
              {editing ? (
                <InputMask
                  className="mask-input"
                  mask="(99) 99999-9999"
                  value={form.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              ) : (
                <span className="detail-value">{form.telefone || "—"}</span>
              )}
            </div>
          </div>

          <div className="form-grid grid-1">
            <div className="detail-item">
              <label>Email</label>
              {editing ? (
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
              ) : (
                <span className="detail-value">{form.email || "—"}</span>
              )}
            </div>
          </div>

          <h3>Endereço</h3>
          <div className="form-grid grid-2">
            <div className="detail-item">
              <label>CEP</label>
              {editing ? (
                <div className="cep-field">
                  <InputMask
                    className="mask-input"
                    mask="99999-999"
                    value={form.cep}
                    onChange={(e) => {
                      const cep = e.target.value;
                      handleChange("cep", cep);
                      if (cep.replace(/\D/g, "").length === 8)
                        handleBuscarCep(cep);
                    }}
                    placeholder="00000-000"
                  />
                </div>
              ) : (
                <span className="detail-value">{form.cep || "—"}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Endereço</label>
              {editing ? (
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => handleChange("endereco", e.target.value)}
                  placeholder="Rua, Avenida..."
                />
              ) : (
                <span className="detail-value">{form.endereco || "—"}</span>
              )}
            </div>
          </div>

          <div className="form-grid grid-3">
            <div className="detail-item">
              <label>Número</label>
              {editing ? (
                <input
                  type="text"
                  value={form.numero}
                  onChange={(e) => handleChange("numero", e.target.value)}
                  placeholder="Nº"
                  maxLength="10"
                />
              ) : (
                <span className="detail-value">{form.numero || "—"}</span>
              )}
            </div>
            <div className="detail-item">
              <label>Complemento</label>
              {editing ? (
                <input
                  type="text"
                  value={form.complemento}
                  onChange={(e) => handleChange("complemento", e.target.value)}
                  placeholder="Apto, Bloco..."
                />
              ) : (
                <span className="detail-value">{form.complemento || "—"}</span>
              )}
            </div>
            <div className="detail-item">
              <label>Bairro</label>
              {editing ? (
                <input
                  type="text"
                  value={form.bairro}
                  onChange={(e) => handleChange("bairro", e.target.value)}
                  placeholder="Bairro"
                />
              ) : (
                <span className="detail-value">{form.bairro || "—"}</span>
              )}
            </div>
          </div>

          <div className="form-grid grid-3">
            <div className="detail-item">
              <label>País</label>
              {editing ? (
                <select
                  value={form.fk_pais}
                  onChange={(e) => handleChange("fk_pais", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {paises.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="detail-value">
                  {getPaisNome(form.fk_pais)}
                </span>
              )}
            </div>
            <div className="detail-item">
              <label>Estado</label>
              {editing ? (
                <select
                  value={form.fk_estado}
                  onChange={(e) => handleChange("fk_estado", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {estados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="detail-value">
                  {getEstadoNome(form.fk_estado)}
                </span>
              )}
            </div>
            <div className="detail-item">
              <label>Município</label>
              {editing ? (
                <select
                  value={form.fk_municipio}
                  onChange={(e) => handleChange("fk_municipio", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {municipios.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="detail-value">
                  {getMunicipioNome(form.fk_municipio)}
                </span>
              )}
            </div>
          </div>

          <div className="modal-footer">
            {editing ? (
              <>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  Salvar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="save-btn"
                onClick={() => setEditing(true)}
              >
                Editar
              </button>
            )}
          </div>
        </form>

        {/* FEEDBACK VISUAL */}
        <LoadingOverlay show={loading} label={loadingMessage} />
        <Toasts toasts={toasts} onClose={closeToast} />
      </div>
    </div>
  );
};

export default UserRegisterModal;
