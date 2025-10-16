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
import { pessoaService } from "../services/pessoaService";
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

  const [editing, setEditing] = useState(!user);
  const [form, setForm] = useState({
    nome: "",
    dataNascimento: "",
    cpf: "",
    rg: "",
    email: "",
    telefone: "",
    fkPais: "",
    fkEstado: "",
    fkMunicipio: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    sexo: "",
    idade: "",
  });

  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [cpfStatus, setCpfStatus] = useState(null);

  useEffect(() => {
    listarPaises().then(setPaises).catch(() => setPaises([]));
    listarEstados().then(setEstados).catch(() => setEstados([]));
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        nome: user.nome || "",
        dataNascimento: user.dataNascimento || "",
        cpf: user.cpf || "",
        rg: user.rg || "",
        email: user.email || "",
        telefone: user.telefone || "",
        fkPais: user.fkPais || "",
        fkEstado: user.fkEstado || "",
        fkMunicipio: user.fkMunicipio || "",
        cep: user.cep || "",
        endereco: user.endereco || "",
        numero: user.numero || "",
        complemento: user.complemento || "",
        bairro: user.bairro || "",
        sexo: user.sexo || "",
        idade: user.idade || "",
      });
      setEditing(false);
    }
  }, [user]);

  useEffect(() => {
    if (form.fkEstado) {
      listarMunicipios(form.fkEstado).then(setMunicipios).catch(() => setMunicipios([]));
    }
  }, [form.fkEstado]);

  const normalize = (str) =>
    str
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim() || "";

  let cepTimeout = null;

  const handleBuscarCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
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
          const estadosData = await listarEstados(1);
          const estadoEncontrado = estadosData.find(
            (e) =>
              normalize(e.nome) === normalize(endereco.estado) ||
              normalize(e.sigla || "") === normalize(ufSigla)
          );
          let municipioEncontrado = null;
          if (estadoEncontrado) {
            const municipiosData = await listarMunicipios(estadoEncontrado.id);
            municipioEncontrado = municipiosData.find(
              (m) => normalize(m.nome) === normalize(cidadeNome)
            );
          }
          setForm((prev) => ({
            ...prev,
            endereco: endereco.logradouro || "",
            bairro: endereco.bairro || "",
            complemento: endereco.complemento || "",
            fkPais: 1,
            fkEstado: estadoEncontrado?.id || "",
            fkMunicipio: municipioEncontrado?.id || "",
          }));
          if (estadoEncontrado && municipioEncontrado) {
            notifySuccess("Endereço preenchido automaticamente!");
          } else if (estadoEncontrado && !municipioEncontrado) {
            notifyError(`Estado encontrado, mas município não localizado (${cidadeNome}).`);
          } else {
            notifyError("Não foi possível identificar o estado/município do CEP.");
          }
        },
        {
          loadingMessage: "Buscando endereço...",
          errorPrefix: "Erro ao buscar CEP",
        }
      );
    }, 500);
  };

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "dataNascimento") {
        updated.idade = calcularIdade(value);
      }
      return updated;
    });
    if (field === "cpf") {
      setCpfStatus(null);
    }
  };

  const verificarCpfCadastrado = async (cpf) => {
    const cleanCpf = cpf.replace(/\D/g, "");
    try {
      const pessoa = await pessoaService.buscarPorCpf(cleanCpf);
      return pessoa !== null;
    } catch (error) {
      return false;
    }
  };

  const limparCampos = () => {
    setForm({
      nome: "",
      dataNascimento: "",
      cpf: "",
      rg: "",
      email: "",
      telefone: "",
      fkPais: "",
      fkEstado: "",
      fkMunicipio: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      sexo: "",
      idade: "",
    });
    setCpfStatus(null);
    setMunicipios([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cpfStatus === "cadastrado" && !user) {
      notifyError("Este CPF já está cadastrado!");
      return;
    }
    await executeWithFeedback(
      async () => {
        const dadosPessoa = {
          id: user?.id || null,
          nome: form.nome,
          dataNascimento: form.dataNascimento || null,
          cpf: form.cpf.replace(/\D/g, ""),
          rg: form.rg?.replace(/\D/g, "") || null,
          email: form.email || null,
          telefone: form.telefone?.replace(/\D/g, "") || null,
          fkPais: form.fkPais ? parseInt(form.fkPais) : null,
          fkEstado: form.fkEstado ? parseInt(form.fkEstado) : null,
          fkMunicipio: form.fkMunicipio ? parseInt(form.fkMunicipio) : null,
          cep: form.cep?.replace(/\D/g, "") || null,
          endereco: form.endereco || null,
          numero: form.numero || null,
          complemento: form.complemento || null,
          bairro: form.bairro || null,
          sexo: form.sexo ? parseInt(form.sexo) : null,
          idade: form.idade || null,
          hospedado: user?.hospedado || false,
          vezesHospedado: user?.vezesHospedado || 0,
          clienteNovo: user?.clienteNovo !== undefined ? user.clienteNovo : true,
          empresasVinculadas: user?.empresasVinculadas || [],
        };
        let pessoaSalva;
        if (user?.id) {
          pessoaSalva = await pessoaService.atualizar(user.id, dadosPessoa);
        } else {
          pessoaSalva = await pessoaService.cadastrar(dadosPessoa);
        }
        notifySuccess(
          user?.id ? "Pessoa atualizada com sucesso!" : "Pessoa cadastrada com sucesso!"
        );
        if (onSave) {
          onSave(pessoaSalva);
        }
        // Modal NÃO será fechado automaticamente!
      },
      {
        loadingMessage: user?.id ? "Atualizando pessoa..." : "Cadastrando pessoa...",
        errorPrefix: user?.id ? "Erro ao atualizar" : "Erro ao cadastrar",
      }
    );
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
                <div style={{ width: "100%" }}>
                  <SingleDatePicker
                    value={form.dataNascimento}
                    onChange={(iso) => handleChange("dataNascimento", iso)}
                    placeholder="—"
                    maxDate={new Date()}
                  />
                </div>
              ) : (
                <span className="detail-value">
                  {formatDate(form.dataNascimento)}
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
                      if (clean.length === 11 && !user) {
                        await executeWithFeedback(
                          async () => {
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
                    disabled={!!user}
                  />
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
                  value={form.fkPais}
                  onChange={(e) => handleChange("fkPais", e.target.value)}
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
                  {getPaisNome(form.fkPais)}
                </span>
              )}
            </div>
            <div className="detail-item">
              <label>Estado</label>
              {editing ? (
                <select
                  value={form.fkEstado}
                  onChange={(e) => handleChange("fkEstado", e.target.value)}
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
                  {getEstadoNome(form.fkEstado)}
                </span>
              )}
            </div>
            <div className="detail-item">
              <label>Município</label>
              {editing ? (
                <select
                  value={form.fkMunicipio}
                  onChange={(e) => handleChange("fkMunicipio", e.target.value)}
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
                  {getMunicipioNome(form.fkMunicipio)}
                </span>
              )}
            </div>
          </div>

          {user && user.empresasVinculadas && user.empresasVinculadas.length > 0 && (
            <>
              <h3>Empresas Vinculadas</h3>
              <div className="empresas-vinculadas">
                {user.empresasVinculadas.map((empresa) => (
                  <div key={empresa.id} className="empresa-card">
                    <strong>{empresa.nomeEmpresa}</strong>
                    <span>CNPJ: {empresa.cnpj}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="modal-footer">
            {editing ? (
              <>
                <button
                  type="button"
                  className="clear-btn"
                  onClick={limparCampos}
                >
                  Limpar Campos
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

        <LoadingOverlay show={loading} label={loadingMessage} />
        <Toasts toasts={toasts} onClose={closeToast} />
      </div>
    </div>
  );
};

export default UserRegisterModal;
