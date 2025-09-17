// src/components/Modals.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  createRoomFromUI,
  updateRoomFromUI,
  ROOM_STATUS_CODE,
} from "../config/endpoints.js";

/* ============ AddCategoryModal (stub visual) ============ */
export function AddCategoryModal({ open, onClose, onSave }) {
  const [name, setName] = useState("");
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Nova Categoria</h3>
        <div className="form-row">
          <label>Nome da categoria</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: SIMPLES" />
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            onClick={() => {
              onSave?.(name.trim());
              setName("");
              onClose?.();
            }}
            disabled={!name.trim()}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ AddRoomModal ============ */
export function AddRoomModal({
  open,
  onClose,
  onSaved,
  onError,
  categoriesOptions = [], // [{value,label}]
  setGlobalLoading = () => {},
}) {
  const [descricao, setDescricao] = useState("");
  const [pessoas, setPessoas] = useState(1);
  const [status, setStatus] = useState(ROOM_STATUS_CODE.DISPONIVEL);
  const [categoriaId, setCategoriaId] = useState("");
  const [beds, setBeds] = useState({ casal: 0, solteiro: 0, rede: 0, beliche: 0 });

  useEffect(() => {
    if (!open) {
      // reset ao fechar
      setDescricao("");
      setPessoas(1);
      setStatus(ROOM_STATUS_CODE.DISPONIVEL);
      setCategoriaId("");
      setBeds({ casal: 0, solteiro: 0, rede: 0, beliche: 0 });
    }
  }, [open]);

  const canSave = useMemo(
    () => Number(pessoas) > 0 && !!categoriaId,
    [pessoas, categoriaId]
  );

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Novo Quarto</h3>

        <div className="form-grid">
          <div className="form-row">
            <label>Descrição</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Vista Jardim" />
          </div>

          <div className="form-row">
            <label>Capacidade (pessoas)</label>
            <input type="number" min={1} value={pessoas} onChange={(e) => setPessoas(Number(e.target.value || 1))} />
          </div>

          <div className="form-row">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(Number(e.target.value))}>
              <option value={ROOM_STATUS_CODE.DISPONIVEL}>Disponível</option>
              <option value={ROOM_STATUS_CODE.LIMPEZA}>Em Limpeza</option>
              <option value={ROOM_STATUS_CODE.MANUTENCAO}>Manutenção</option>
            </select>
          </div>

          <div className="form-row">
            <label>Categoria</label>
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Selecione...</option>
              {categoriesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Camas (disposição)</label>
            <div className="beds-grid">
              <div>
                <span>Casal</span>
                <input type="number" min={0} value={beds.casal}
                       onChange={(e) => setBeds((b) => ({ ...b, casal: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <span>Solteiro</span>
                <input type="number" min={0} value={beds.solteiro}
                       onChange={(e) => setBeds((b) => ({ ...b, solteiro: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <span>Rede</span>
                <input type="number" min={0} value={beds.rede}
                       onChange={(e) => setBeds((b) => ({ ...b, rede: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <span>Beliche</span>
                <input type="number" min={0} value={beds.beliche}
                       onChange={(e) => setBeds((b) => ({ ...b, beliche: Number(e.target.value || 0) }))} />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            disabled={!canSave}
            onClick={async () => {
              try {
                setGlobalLoading(true);
                await createRoomFromUI({ descricao, pessoas, status, categoriaId, beds });
                onSaved?.();
              } catch (e) {
                console.error(e);
                onError?.(e.message);
              } finally {
                setGlobalLoading(false);
              }
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ RoomDetailsModal (editar) ============ */
export function RoomDetailsModal({
  open,
  onClose,
  room, // shape da UI (numero, tipo, pessoas, status, beds, ...)
  onSaved,
  onError,
  categoriesOptions = [],
  setGlobalLoading = () => {},
}) {
  const [descricao, setDescricao] = useState("");
  const [pessoas, setPessoas] = useState(1);
  const [status, setStatus] = useState(ROOM_STATUS_CODE.DISPONIVEL);
  const [categoriaId, setCategoriaId] = useState("");
  const [beds, setBeds] = useState({ casal: 0, solteiro: 0, rede: 0, beliche: 0 });

  useEffect(() => {
    if (open && room) {
      setDescricao(room.descricao ?? "");
      setPessoas(Number(room.pessoas || 1));
      setStatus(Number(room.status || ROOM_STATUS_CODE.DISPONIVEL));
      // tentar mapear a categoria pelo label (nome) vindo no card
      const found = categoriesOptions.find((o) => o.label === room.tipo);
      setCategoriaId(found ? String(found.value) : "");
      setBeds({
        casal: Number(room.beds?.casal || 0),
        solteiro: Number(room.beds?.solteiro || 0),
        rede: Number(room.beds?.rede || 0),
        beliche: Number(room.beds?.beliche || 0),
      });
    }
  }, [open, room, categoriesOptions]);

  if (!open || !room) return null;

  const canSave = Number(pessoas) > 0 && !!categoriaId;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Detalhes do Quarto #{room.numero}</h3>

        <div className="form-grid">
          <div className="form-row">
            <label>Descrição</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Vista Jardim" />
          </div>

          <div className="form-row">
            <label>Capacidade (pessoas)</label>
            <input type="number" min={1} value={pessoas} onChange={(e) => setPessoas(Number(e.target.value || 1))} />
          </div>

          <div className="form-row">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(Number(e.target.value))}>
              <option value={ROOM_STATUS_CODE.DISPONIVEL}>Disponível</option>
              <option value={ROOM_STATUS_CODE.LIMPEZA}>Em Limpeza</option>
              <option value={ROOM_STATUS_CODE.MANUTENCAO}>Manutenção</option>
              <option value={ROOM_STATUS_CODE.RESERVADO}>Reservado</option>
              <option value={ROOM_STATUS_CODE.OCUPADO}>Ocupado</option>
              <option value={ROOM_STATUS_CODE.DIARIA_ENCERRADA}>Diária Encerrada</option>
            </select>
          </div>

          <div className="form-row">
            <label>Categoria</label>
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Selecione...</option>
              {categoriesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Camas (disposição)</label>
            <div className="beds-grid">
              <div>
                <span>Casal</span>
                <input type="number" min={0} value={beds.casal}
                       onChange={(e) => setBeds((b) => ({ ...b, casal: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <span>Solteiro</span>
                <input type="number" min={0} value={beds.solteiro}
                       onChange={(e) => setBeds((b) => ({ ...b, solteiro: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <span>Rede</span>
                <input type="number" min={0} value={beds.rede}
                       onChange={(e) => setBeds((b) => ({ ...b, rede: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <span>Beliche</span>
                <input type="number" min={0} value={beds.beliche}
                       onChange={(e) => setBeds((b) => ({ ...b, beliche: Number(e.target.value || 0) }))} />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Fechar</button>
          <button
            className="btn primary"
            disabled={!canSave}
            onClick={async () => {
              try {
                setGlobalLoading(true);
                await updateRoomFromUI(room.numero, { descricao, pessoas, status, categoriaId, beds });
                onSaved?.();
              } catch (e) {
                console.error(e);
                onError?.(e.message);
              } finally {
                setGlobalLoading(false);
              }
            }}
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
