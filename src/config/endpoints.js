// src/config/endpoints.js

// ===== Base URL detect (Vite/Next/CRA) =====
const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && process.env && (process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_BASE_URL)) ||
  "http://localhost:8080";

// ===== Rotas centralizadas =====
export const API = {
  BASE_URL,
  QUARTOS: "/api/quartos",
  QUARTOS_STATUS: "/api/quartos/status",
  CATEGORIAS: "/api/categorias",
};

// ===== Status: enum ⇄ código (UI usa número) =====
export const ROOM_STATUS_CODE = {
  OCUPADO: 1,
  DISPONIVEL: 2,
  RESERVADO: 3,
  LIMPEZA: 4,
  DIARIA_ENCERRADA: 5,
  MANUTENCAO: 6,
};
export const CODE_TO_ENUM = Object.fromEntries(
  Object.entries(ROOM_STATUS_CODE).map(([k, v]) => [String(v), k])
);

// ===== Internals HTTP =====
function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  if (params.date) qs.set("date", params.date);      // yyyy-MM-dd
  if (params.status) qs.set("status", params.status); // enum string ("DISPONIVEL")
  if (params.search) qs.set("search", params.search);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

async function httpGet(path, params) {
  const url = `${API.BASE_URL}${path}${buildQuery(params)}`;
  const res = await fetch(url, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} GET ${path}: ${text || res.statusText}`);
  }
  return res.json();
}
async function httpPost(path, body) {
  const url = `${API.BASE_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} POST ${path}: ${text || res.statusText}`);
  }
  return res.json();
}
async function httpPut(path, body) {
  const url = `${API.BASE_URL}${path}`;
  const res = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} PUT ${path}: ${text || res.statusText}`);
  }
  return res.json();
}

// ===== Endpoints =====

// GET /api/quartos
export async function getRooms({ date, statusCode, search } = {}) {
  const statusEnum = statusCode ? CODE_TO_ENUM[String(statusCode)] : undefined;
  return httpGet(API.QUARTOS, { date, status: statusEnum, search });
}

// GET /api/quartos/status
export async function getRoomStatuses() {
  return httpGet(API.QUARTOS_STATUS);
}

// GET /api/categorias   -> [{id, categoria}]
export async function getCategories() {
  return httpGet(API.CATEGORIAS);
}

// POST /api/quartos     -> cria quarto
export async function createRoomFromUI(ui) {
  const payload = buildRoomPayloadFromUI(ui);
  return httpPost(API.QUARTOS, payload);
}

// PUT /api/quartos/{id} -> edita quarto
export async function updateRoomFromUI(id, ui) {
  if (!id) throw new Error("ID do quarto não informado.");
  const payload = buildRoomPayloadFromUI(ui);
  return httpPut(`${API.QUARTOS}/${id}`, payload);
}

// Opcional: GET /api/quartos/{id}
export async function getRoomById(id) {
  if (!id) throw new Error("ID do quarto não informado.");
  return httpGet(`${API.QUARTOS}/${id}`);
}

// ===== Adapters =====

// RoomsResponse -> UI atual (cards)
export function adaptRoomsResponseToUI(roomsResponse) {
  if (!roomsResponse || !Array.isArray(roomsResponse.categoryList)) return [];

  const toBrDate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = String(iso).split("-");
    return y && m && d ? `${d.padStart(2,"0")}/${m.padStart(2,"0")}/${y}` : "";
  };

  return roomsResponse.categoryList.flatMap((cat) => {
    const tipo = cat?.category || "—";
    const rooms = Array.isArray(cat?.rooms) ? cat.rooms : [];
    return rooms.map((r) => {
      const status = ROOM_STATUS_CODE[r?.roomStatusEnum] ?? 0;
      const beds = {
        solteiro: Number(r?.singleBedAmount || 0),
        casal: Number(r?.doubleBedAmount || 0),
        beliche: Number(r?.bunkbedAmount || 0),
        rede: Number(r?.hammockAmount || 0),
      };
      const h = r?.holder || null;
      const representante = h?.name || null;
      const cpf = h?.cpf || null;
      const telefone = h?.phoneNumber || null;
      const pessoas = Number(r?.roomCapacity || 1);
      const entrada = h?.checkin ? toBrDate(h.checkin) : "";
      const saida = h?.checkout ? toBrDate(h.checkout) : "";
      const horaEntrada = h?.estimatedArrivalTime || "";
      const horaSaida = h?.estimatedDepartureTime || "";
      const du = r?.dayUse || null;
      const finalStatus = du ? ROOM_STATUS_CODE.DIARIA_ENCERRADA : status;

      return {
        numero: Number(r?.id),   // "número" na UI = id do quarto
        tipo,                    // nome da categoria
        status: finalStatus,
        pessoas,
        beds,
        representante,
        cpf,
        telefone,
        entrada,
        saida,
        horaEntrada,
        horaSaida,
      };
    });
  });
}

// Categoria[] -> opções para combobox [{value,label}]
export function adaptCategoriesToOptions(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map((c) => ({
    value: c.id,
    label: c.categoria ?? `Categoria ${c.id}`,
  }));
}

// Map antigo opcional
export function adaptCategoriesToLegacyMap(categories) {
  const map = {};
  (categories || []).forEach((c) => {
    const name = c.categoria ?? `Categoria ${c.id}`;
    map[name] = { id: c.id };
  });
  return map;
}

// ===== UI -> API payload (quarto) =====
export function buildRoomPayloadFromUI(ui) {
  const beds = ui?.beds || {};
  return {
    descricao: ui?.descricao ?? ui?.title ?? null,
    quantidade_pessoas: Number(ui?.pessoas ?? ui?.roomCapacity ?? 1),
    status_quarto_enum: Number(ui?.status ?? ui?.status_quarto_enum ?? ROOM_STATUS_CODE.DISPONIVEL),
    qtd_cama_casal: Number(beds.casal ?? ui?.qtd_cama_casal ?? 0),
    qtd_cama_solteiro: Number(beds.solteiro ?? ui?.qtd_cama_solteiro ?? 0),
    qtd_rede: Number(beds.rede ?? ui?.qtd_rede ?? 0),
    qtd_beliche: Number(beds.beliche ?? ui?.qtd_beliche ?? 0),
    fk_categoria: Number(ui?.categoriaId ?? ui?.fk_categoria ?? 0) || null,
  };
}

// Entidade `quarto` -> UI (para atualizar card sem refetch total)
export function adaptRoomEntityToUI(entity, categoryName) {
  if (!entity) return null;
  const beds = {
    casal: Number(entity.qtd_cama_casal || 0),
    solteiro: Number(entity.qtd_cama_solteiro || 0),
    rede: Number(entity.qtd_rede || 0),
    beliche: Number(entity.qtd_beliche || 0),
  };
  return {
    numero: Number(entity.id),
    tipo: categoryName || entity.categoria || "—",
    status: Number(entity.status_quarto_enum ?? ROOM_STATUS_CODE.DISPONIVEL),
    pessoas: Number(entity.quantidade_pessoas || 1),
    beds,
    representante: null,
    cpf: null,
    telefone: null,
  };
}
