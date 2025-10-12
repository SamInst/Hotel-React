// src/pages/VehicleRegisterModal.jsx
import React, { useState, useEffect } from "react";
import InputMask from "react-input-mask";
import "./UserRegisterModal.css";
import { buscarVeiculoPorPlaca } from "../services/vehicleService";
import { useUIFeedback, LoadingOverlay, Toasts } from "../config/uiUtilities";

const VehicleRegisterModal = ({ vehicle, onClose, onSave }) => {
  const {
    loading,
    loadingMessage,
    executeWithFeedback,
    toasts,
    closeToast,
    notifySuccess,
    notifyError,
  } = useUIFeedback();

  const [editing, setEditing] = useState(!vehicle);
  const [form, setForm] = useState({
    placa: "",
    marca: "",
    modelo: "",
    cor: "",
    ano_fabricacao: "",
    ano_modelo: "",
    renavam: "",
    chassi: "",
    tipo_veiculo: "",
    capacidade: "",
    combustivel: "",
    proprietario: "",
    cpf_cnpj_proprietario: "",
    telefone_proprietario: "",
    observacoes: "",
  });

  useEffect(() => {
    if (vehicle) {
      setForm({
        placa: vehicle.placa || "",
        marca: vehicle.marca || "",
        modelo: vehicle.modelo || "",
        cor: vehicle.cor || "",
        ano_fabricacao: vehicle.ano_fabricacao || "",
        ano_modelo: vehicle.ano_modelo || "",
        renavam: vehicle.renavam || "",
        chassi: vehicle.chassi || "",
        tipo_veiculo: vehicle.tipo_veiculo || "",
        capacidade: vehicle.capacidade || "",
        combustivel: vehicle.combustivel || "",
        proprietario: vehicle.proprietario || "",
        cpf_cnpj_proprietario: vehicle.cpf_cnpj_proprietario || "",
        telefone_proprietario: vehicle.telefone_proprietario || "",
        observacoes: vehicle.observacoes || "",
      });
      setEditing(false);
    }
  }, [vehicle]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const handleCancel = () => {
    if (vehicle) {
      setForm(vehicle);
      setEditing(false);
    } else {
      onClose();
    }
  };

  const getTipoVeiculoLabel = (tipo) => {
    const tipos = {
      carro: "Carro",
      moto: "Moto",
      caminhonete: "Caminhonete",
      van: "Van",
      onibus: "Ônibus",
      caminhao: "Caminhão",
    };
    return tipos[tipo] || "—";
  };

  const getCombustivelLabel = (combustivel) => {
    const combustiveis = {
      gasolina: "Gasolina",
      etanol: "Etanol",
      diesel: "Diesel",
      flex: "Flex",
      gnv: "GNV",
      eletrico: "Elétrico",
      hibrido: "Híbrido",
    };
    return combustiveis[combustivel] || "—";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {vehicle
              ? editing
                ? "Editar Veículo"
                : "Dados do Veículo"
              : "Cadastrar Veículo"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <h3>Informações do Veículo</h3>

          <div className="form-grid grid-3">
            <div className="detail-item">
              <label>Placa *</label>
              {editing ? (
                <InputMask
                  className="mask-input"
                  mask="aaa-9*99"
                  formatChars={{
                    "9": "[0-9]",
                    a: "[A-Za-z]",
                    "*": "[A-Za-z0-9]",
                  }}
                  value={form.placa}
                  onChange={async (e) => {
                    const placaValue = e.target.value.toUpperCase();
                    handleChange("placa", placaValue);

                    const clean = placaValue.replace(/[^A-Za-z0-9]/g, "");
                    if (clean.length === 7) {
                      await executeWithFeedback(
                        async () => {
                          const dados = await buscarVeiculoPorPlaca(clean);
                          if (dados) {
                            setForm((prev) => ({
                              ...prev,
                              ...dados,
                            }));
                            notifySuccess(
                              "Dados do veículo preenchidos automaticamente!"
                            );
                          } else {
                            notifyError(
                              "Não foi possível localizar a placa informada."
                            );
                          }
                        },
                        {
                          loadingMessage: "Buscando dados do veículo...",
                          errorPrefix: "Erro na consulta",
                        }
                      );
                    }
                  }}
                  required
                  placeholder="ABC-1234"
                />
              ) : (
                <span className="detail-value">{form.placa || "—"}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Marca *</label>
              {editing ? (
                <input
                  type="text"
                  required
                  value={form.marca}
                  onChange={(e) => handleChange("marca", e.target.value)}
                  placeholder="Ex: Toyota, Honda, Ford"
                />
              ) : (
                <span className="detail-value">{form.marca || "—"}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Modelo *</label>
              {editing ? (
                <input
                  type="text"
                  required
                  value={form.modelo}
                  onChange={(e) => handleChange("modelo", e.target.value)}
                  placeholder="Ex: Corolla, Civic, Focus"
                />
              ) : (
                <span className="detail-value">{form.modelo || "—"}</span>
              )}
            </div>
          </div>

          {/* Os demais campos permanecem idênticos */}
          {/* ... (copie todos os blocos de campos do seu arquivo original) ... */}

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

export default VehicleRegisterModal;
