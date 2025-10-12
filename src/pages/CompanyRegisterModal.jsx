import React, { useState, useEffect } from "react";
import InputMask from "react-input-mask";
import "./UserRegisterModal.css";
import {
  buscarEnderecoPorCep,
  listarPaises,
  listarEstados,
  listarMunicipios,
} from "../services/enderecoService";
import { buscarCnpj } from "../services/cnpjService";
import { useUIFeedback, LoadingOverlay, Toasts } from "../config/uiUtilities";

const CompanyRegisterModal = ({ company, onClose, onSave }) => {
  const {
    loading,
    loadingMessage,
    executeWithFeedback,
    toasts,
    closeToast,
    notifySuccess,
    notifyError,
  } = useUIFeedback();

  const [editing, setEditing] = useState(!company);
  const [form, setForm] = useState({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
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
    tipo_empresa: "",
    ativa: "1",
    pessoasVinculadas: [],
    pessoaSelecionada: "",
  });

  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [pessoasDisponiveis, setPessoasDisponiveis] = useState([]);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    listarPaises()
      .then(setPaises)
      .catch(() => setPaises([]));
    listarEstados()
      .then(setEstados)
      .catch(() => setEstados([]));
  }, []);

  useEffect(() => {
    if (company) {
      setForm({
        razao_social: company.razao_social || "",
        nome_fantasia: company.nome_fantasia || "",
        cnpj: company.cnpj || "",
        inscricao_estadual: company.inscricao_estadual || "",
        inscricao_municipal: company.inscricao_municipal || "",
        email: company.email || "",
        telefone: company.telefone || "",
        fk_pais: company.fk_pais || "",
        fk_estado: company.fk_estado || "",
        fk_municipio: company.fk_municipio || "",
        cep: company.cep || "",
        endereco: company.endereco || "",
        numero: company.numero || "",
        complemento: company.complemento || "",
        bairro: company.bairro || "",
        tipo_empresa: company.tipo_empresa || "",
        ativa: company.ativa || "1",
        pessoasVinculadas: company.pessoasVinculadas || [],
        pessoaSelecionada: "",
      });
      setEditing(false);
    }
  }, [company]);

  useEffect(() => {
    if (form.fk_estado) {
      listarMunicipios(form.fk_estado)
        .then(setMunicipios)
        .catch(() => setMunicipios([]));
    }
  }, [form.fk_estado]);

  useEffect(() => {
    fetch("/api/pessoas")
      .then((res) => res.json())
      .then(setPessoasDisponiveis)
      .catch(() => setPessoasDisponiveis([]));
  }, []);

  // Função utilitária para normalizar textos (remove acentos e converte para minúsculas)
  // Função utilitária para normalizar textos (remove acentos e deixa minúsculo)
  const normalize = (str) =>
    str
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim() || "";

  // Debounce global para evitar múltiplas buscas
  let cepTimeout = null;

  const handleBuscarCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return; // só busca quando tiver 8 dígitos

    if (cepTimeout) clearTimeout(cepTimeout);

    cepTimeout = setTimeout(async () => {
      try {
        setLoadingCep(true);

        const endereco = await buscarEnderecoPorCep(cleanCep);
        if (!endereco) {
          notifyError("CEP não encontrado.");
          return;
        }

        const ufSigla = endereco.uf;
        const cidadeNome = endereco.localidade;

        // Busca os estados do país Brasil (id=1)
        const estadosData = await listarEstados(1);

        // Encontra o estado pelo nome ou sigla (ex: MG → Minas Gerais)
        const estadoEncontrado = estadosData.find(
          (e) =>
            normalize(e.nome) === normalize(endereco.estado) ||
            normalize(e.sigla || "") === normalize(ufSigla)
        );

        let municipioEncontrado = null;

        // Busca municípios apenas se o estado foi encontrado
        if (estadoEncontrado) {
          const municipiosData = await listarMunicipios(estadoEncontrado.id);

          // Encontra município pelo nome (ex: "Montes Claros")
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
          fk_pais: 1, // Brasil
          fk_estado: estadoEncontrado?.id || "",
          fk_municipio: municipioEncontrado?.id || "",
        }));

        if (estadoEncontrado && municipioEncontrado) {
          notifySuccess("Endereço preenchido automaticamente!");
        } else if (estadoEncontrado && !municipioEncontrado) {
          notifyError(
            `Estado encontrado (${estadoEncontrado.descricao}), mas município não localizado (${cidadeNome}).`
          );
        } else {
          notifyError(
            "Não foi possível identificar o estado/município do CEP."
          );
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
        notifyError("Erro ao consultar o CEP.");
      } finally {
        setLoadingCep(false);
      }
    }, 500); // espera 500ms após parar de digitar
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const handleCancel = () => {
    if (company) {
      setForm({
        razao_social: company.razao_social || "",
        nome_fantasia: company.nome_fantasia || "",
        cnpj: company.cnpj || "",
        inscricao_estadual: company.inscricao_estadual || "",
        inscricao_municipal: company.inscricao_municipal || "",
        email: company.email || "",
        telefone: company.telefone || "",
        fk_pais: company.fk_pais || "",
        fk_estado: company.fk_estado || "",
        fk_municipio: company.fk_municipio || "",
        cep: company.cep || "",
        endereco: company.endereco || "",
        numero: company.numero || "",
        complemento: company.complemento || "",
        bairro: company.bairro || "",
        tipo_empresa: company.tipo_empresa || "",
        ativa: company.ativa || "1",
        pessoasVinculadas: company.pessoasVinculadas || [],
        pessoaSelecionada: "",
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

  const getStatusLabel = (ativa) =>
    ativa === "1" || ativa === 1 ? "Ativa" : "Inativa";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {company
              ? editing
                ? "Editar Empresa"
                : "Dados da Empresa"
              : "Cadastrar Empresa"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* DADOS GERAIS */}
          <div className="form-grid grid-2">
            <div className="detail-item">
              <label>Razão Social *</label>
              {editing ? (
                <input
                  type="text"
                  required
                  value={form.razao_social}
                  onChange={(e) => handleChange("razao_social", e.target.value)}
                  placeholder="Razão social da empresa"
                />
              ) : (
                <span className="detail-value">{form.razao_social || "—"}</span>
              )}
            </div>
            <div className="detail-item">
              <label>Nome Fantasia</label>
              {editing ? (
                <input
                  type="text"
                  value={form.nome_fantasia}
                  onChange={(e) =>
                    handleChange("nome_fantasia", e.target.value)
                  }
                  placeholder="Nome fantasia"
                />
              ) : (
                <span className="detail-value">
                  {form.nome_fantasia || "—"}
                </span>
              )}
            </div>
          </div>

          <div className="form-grid grid-3">
            <div className="detail-item">
              <label>CNPJ *</label>
              {editing ? (
                <InputMask
                  className="mask-input"
                  mask="99.999.999/9999-99"
                  value={form.cnpj}
                  onChange={async (e) => {
                    const cnpjValue = e.target.value;
                    handleChange("cnpj", cnpjValue);

                    const clean = cnpjValue.replace(/\D/g, "");
                    if (clean.length === 14) {
                      await executeWithFeedback(
                        async () => {
                          const dados = await buscarCnpj(clean);
                          if (dados) {
                            // Preenche os dados básicos da empresa
                            setForm((prev) => ({
                              ...prev,
                              ...dados,
                            }));

                            // Se o CNPJ retornou um CEP válido, reaproveita a busca do CEP
                            if (
                              dados.cep &&
                              dados.cep.replace(/\D/g, "").length === 8
                            ) {
                              await handleBuscarCep(dados.cep);
                            }

                            notifySuccess(
                              "Dados da empresa preenchidos automaticamente!"
                            );
                          } else {
                            notifyError("Não foi possível localizar o CNPJ.");
                          }
                        },
                        {
                          loadingMessage: "Buscando dados do CNPJ...",
                          errorPrefix: "Erro na consulta",
                        }
                      );
                    }
                  }}
                  required
                  placeholder="00.000.000/0000-00"
                />
              ) : (
                <span className="detail-value">{form.cnpj || "—"}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Inscrição Estadual</label>
              {editing ? (
                <input
                  type="text"
                  value={form.inscricao_estadual}
                  onChange={(e) =>
                    handleChange("inscricao_estadual", e.target.value)
                  }
                  placeholder="Inscrição estadual"
                />
              ) : (
                <span className="detail-value">
                  {form.inscricao_estadual || "—"}
                </span>
              )}
            </div>
            <div className="detail-item">
              <label>Inscrição Municipal</label>
              {editing ? (
                <input
                  type="text"
                  value={form.inscricao_municipal}
                  onChange={(e) =>
                    handleChange("inscricao_municipal", e.target.value)
                  }
                  placeholder="Inscrição municipal"
                />
              ) : (
                <span className="detail-value">
                  {form.inscricao_municipal || "—"}
                </span>
              )}
            </div>
          </div>

          <div className="form-grid grid-3">
            <div className="detail-item">
              <label>Email</label>
              {editing ? (
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@empresa.com"
                />
              ) : (
                <span className="detail-value">{form.email || "—"}</span>
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
            <div className="detail-item">
              <label>Tipo de Empresa</label>
              {editing ? (
                <select
                  value={form.tipo_empresa}
                  onChange={(e) => handleChange("tipo_empresa", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="ME">Microempresa (ME)</option>
                  <option value="EPP">Empresa de Pequeno Porte (EPP)</option>
                  <option value="LTDA">Limitada (LTDA)</option>
                  <option value="SA">Sociedade Anônima (SA)</option>
                  <option value="EIRELI">EIRELI</option>
                  <option value="MEI">
                    Microempreendedor Individual (MEI)
                  </option>
                </select>
              ) : (
                <span className="detail-value">{form.tipo_empresa || "—"}</span>
              )}
            </div>
          </div>

          <div className="form-grid grid-1">
            <div className="detail-item">
              <label>Status</label>
              {editing ? (
                <select
                  value={form.ativa}
                  onChange={(e) => handleChange("ativa", e.target.value)}
                >
                  <option value="1">Ativa</option>
                  <option value="0">Inativa</option>
                </select>
              ) : (
                <span className="detail-value">
                  {getStatusLabel(form.ativa)}
                </span>
              )}
            </div>
          </div>

          {/* ENDEREÇO */}
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

                  {loadingCep && (
                    <small className="loading-text">Buscando CEP...</small>
                  )}
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
                  placeholder="Sala, Andar..."
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

          {/* PESSOAS VINCULADAS */}
          <div className="form-grid grid-1">
            <div className="detail-item">
              {editing ? (
                <>
                  <label>Buscar Pessoa para Vincular</label>

                  {/* Campo de busca */}
                  <div
                    className="search-container"
                    style={{ marginBottom: "12px" }}
                  >
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Digite nome ou CPF..."
                      value={form.pessoaSelecionada}
                      onChange={(e) =>
                        handleChange("pessoaSelecionada", e.target.value)
                      }
                    />
                  </div>

                  {/* Lista de resultados (estilo UsersPage) */}
                  {form.pessoaSelecionada && (
                    <div
                      className="users-list"
                      style={{ marginBottom: "16px" }}
                    >
                      {pessoasDisponiveis
                        .filter((p) => {
                          const term = form.pessoaSelecionada.toLowerCase();
                          return (
                            p.nome.toLowerCase().includes(term) ||
                            p.cpf
                              .replace(/\D/g, "")
                              .includes(term.replace(/\D/g, ""))
                          );
                        })
                        .slice(0, 5)
                        .map((pessoa) => (
                          <div key={pessoa.id} className="user-card small">
                            <div className="user-avatar">
                              <div className="avatar-fallback">
                                {pessoa.nome
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </div>
                            </div>
                            <div className="user-info">
                              <h4 className="user-name">{pessoa.nome}</h4>
                              <p className="user-email">{pessoa.email}</p>
                              <p className="user-phone">{pessoa.telefone}</p>
                            </div>
                            <div className="user-actions">
                              <button
                                type="button"
                                className="action-button edit"
                                onClick={() => {
                                  if (
                                    !form.pessoasVinculadas?.some(
                                      (p) => String(p.id) === String(pessoa.id)
                                    )
                                  ) {
                                    setForm((prev) => ({
                                      ...prev,
                                      pessoasVinculadas: [
                                        ...(prev.pessoasVinculadas || []),
                                        pessoa,
                                      ],
                                      pessoaSelecionada: "",
                                    }));
                                  }
                                }}
                              >
                                Vincular
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Lista de pessoas já vinculadas */}
                  {form.pessoasVinculadas?.length > 0 && (
                    <>
                      <h4>Pessoas já vinculadas:</h4>
                      <div className="users-list">
                        {form.pessoasVinculadas.map((pessoa) => (
                          <div key={pessoa.id} className="user-card small">
                            <div className="user-avatar">
                              <div className="avatar-fallback">
                                {pessoa.nome
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </div>
                            </div>
                            <div className="user-info">
                              <h4 className="user-name">{pessoa.nome}</h4>
                              <p className="user-email">{pessoa.email}</p>
                            </div>
                            <div className="user-actions">
                              <button
                                type="button"
                                className="action-button delete"
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    pessoasVinculadas:
                                      prev.pessoasVinculadas.filter(
                                        (p) => p.id !== pessoa.id
                                      ),
                                  }))
                                }
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {form.pessoasVinculadas?.length > 0 ? (
                    <ul className="person-list">
                      {form.pessoasVinculadas.map((pessoa) => (
                        <li key={pessoa.id} className="person-item readonly">
                          <span>
                            <strong>{pessoa.nome}</strong> — {pessoa.cpf}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-persons">Nenhuma pessoa vinculada.</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RODAPÉ */}
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

export default CompanyRegisterModal;
