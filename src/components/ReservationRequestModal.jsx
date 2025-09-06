// // Dashboard component - adicione antes do calendário
// import React, { useMemo, useState } from 'react';
// import ReservationRequestModal from '../components/ReservationRequestModal.jsx';

// // Modal de Solicitação de Reserva
// function ReservationRequestModal({ open, onClose, reservation, onConfirm, onCancel }) {
//   if (!reservation) return null;

//   const checkinDate = new Date(reservation.start);
//   const checkoutDate = new Date(reservation.end);
//   const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
//   const dailyRate = 80;
//   const totalValue = nights * dailyRate;
//   const paidAmount = 160;
//   const remainingAmount = totalValue - paidAmount;

//   // Mock de dados dos hóspedes (em um sistema real, viria da reserva)
//   const guests = [
//     {
//       id: 1,
//       name: "Amelia Santos Andrade",
//       cpf: "123.456.789-00",
//       phone: "(98) 9 8787-9090",
//       birthDate: "12/12/2002",
//       rg: "033.567.765.009-2",
//       email: "EMAIL@EMAIL.COM",
//       gender: "Feminino",
//       nationality: "Viana, Maranhão, Brasil",
//       profession: "Engenheira de Software",
//       isRepresentative: true
//     },
//     {
//       id: 2,
//       name: "Vicente Santos",
//       cpf: "123.456.789-00", 
//       phone: "(98) 9 8787-9090",
//       birthDate: "12/12/2002",
//       rg: "033.567.765.009-2",
//       email: "EMAIL@EMAIL.COM",
//       gender: "Feminino",
//       nationality: "Viana, Maranhão, Brasil",
//       profession: "Engenheira de Software",
//       isRepresentative: false
//     }
//   ];

//   const formatDate = (date) => {
//     return date.toLocaleDateString("pt-BR");
//   };

//   return (
//     <Modal 
//       open={open} 
//       onClose={onClose}
//       dialogStyle={{
//         width: '600px',
//         maxWidth: '95vw',
//         margin: '0',
//         padding: '0'
//       }}
//       backdropStyle={{
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         padding: '20px'
//       }}
//     >
//       <div
//         className="form-card"
//         style={{
//           width: "100%",
//           height: "85vh",
//           display: "flex",
//           flexDirection: "column",
//           padding: 0,
//           overflow: "hidden"
//         }}
//       >
//         {/* Header fixo */}
//         <div style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "20px 24px",
//           borderBottom: "1px solid #e5e7eb",
//           background: "#f9fafb",
//           flexShrink: 0
//         }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
//             <div style={{
//               width: 40,
//               height: 40,
//               background: "#f97316",
//               borderRadius: 8,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               fontSize: 20,
//               flexShrink: 0
//             }}>
//               🏨
//             </div>
//             <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1f2937" }}>
//               Solicitação de Reserva
//             </h2>
//           </div>
//           <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
//             <button
//               className="btn"
//               onClick={onCancel}
//               style={{
//                 background: "#ef4444",
//                 color: "white",
//                 border: "none",
//                 borderRadius: 6,
//                 padding: "8px 16px",
//                 fontSize: 14,
//                 fontWeight: 500,
//                 cursor: "pointer",
//                 transition: "all 0.2s ease"
//               }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.background = "#dc2626";
//                 e.currentTarget.style.transform = "translateY(-1px)";
//                 e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.4)";
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.background = "#ef4444";
//                 e.currentTarget.style.transform = "translateY(0)";
//                 e.currentTarget.style.boxShadow = "none";
//               }}
//             >
//               Cancelar
//             </button>
//             <button
//               className="btn btn--primary"
//               onClick={onConfirm}
//               style={{
//                 background: "#3b82f6",
//                 border: "none",
//                 borderRadius: 6,
//                 padding: "8px 16px",
//                 fontSize: 14,
//                 fontWeight: 500,
//                 cursor: "pointer",
//                 transition: "all 0.2s ease"
//               }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.background = "#2563eb";
//                 e.currentTarget.style.transform = "translateY(-1px)";
//                 e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.4)";
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.background = "#3b82f6";
//                 e.currentTarget.style.transform = "translateY(0)";
//                 e.currentTarget.style.boxShadow = "none";
//               }}
//             >
//               Confirmar Reserva
//             </button>
//           </div>
//         </div>

//         {/* Content com rolagem */}
//         <div style={{ 
//           flex: 1, 
//           overflow: "auto", 
//           padding: "20px"
//         }}>
//           {/* Dados solicitados */}
//           <div style={{ marginBottom: 24 }}>
//             <h3 style={{ 
//               margin: "0 0 16px 0", 
//               fontSize: 18, 
//               fontWeight: 600, 
//               color: "#1f2937" 
//             }}>
//               Dados solicitados
//             </h3>
            
//             <div style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16,
//               marginBottom: 16
//             }}>
//               <div>
//                 <div style={{ fontSize: 14, color: "#1f2937", marginBottom: 4 }}>
//                   <strong>Quarto:</strong>
//                 </div>
//                 <div style={{ fontSize: 16, color: "#1f2937" }}>
//                   {String(reservation.roomId).padStart(2, '0')}
//                 </div>
//               </div>
              
//               <div>
//                 <div style={{ fontSize: 14, color: "#1f2937", marginBottom: 4 }}>
//                   <strong>Checkin:</strong>
//                 </div>
//                 <div style={{ fontSize: 16, color: "#1f2937" }}>
//                   {formatDate(checkinDate)}
//                 </div>
//               </div>
              
//               <div>
//                 <div style={{ fontSize: 14, color: "#1f2937", marginBottom: 4 }}>
//                   <strong>Chegada prevista:</strong>
//                 </div>
//                 <div style={{ fontSize: 16, color: "#1f2937" }}>
//                   13:00
//                 </div>
//               </div>
//             </div>

//             <div style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16
//             }}>
//               <div>
//                 <div style={{ fontSize: 14, color: "#1f2937", marginBottom: 4 }}>
//                   <strong>Diárias:</strong>
//                 </div>
//                 <div style={{ fontSize: 16, color: "#1f2937" }}>
//                   {nights}
//                 </div>
//               </div>
              
//               <div>
//                 <div style={{ fontSize: 14, color: "#1f2937", marginBottom: 4 }}>
//                   <strong>Checkout:</strong>
//                 </div>
//                 <div style={{ fontSize: 16, color: "#1f2937" }}>
//                   {formatDate(checkoutDate)}
//                 </div>
//               </div>
              
//               <div>
//                 <div style={{ fontSize: 14, color: "#1f2937", marginBottom: 4 }}>
//                   <strong>Saída Prevista:</strong>
//                 </div>
//                 <div style={{ fontSize: 16, color: "#1f2937" }}>
//                   11:00
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Valores */}
//           <div style={{ marginBottom: 24 }}>
//             <h3 style={{ 
//               margin: "0 0 16px 0", 
//               fontSize: 18, 
//               fontWeight: 600, 
//               color: "#1f2937" 
//             }}>
//               Valores
//             </h3>
            
//             <div style={{
//               display: "grid",
//               gridTemplateColumns: "1fr 1fr",
//               gap: 32
//             }}>
//               <div>
//                 <div style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                   marginBottom: 8
//                 }}>
//                   <span style={{ fontSize: 14, color: "#1f2937" }}><strong>Valor Diaria:</strong></span>
//                   <span style={{ fontSize: 14, color: "#1f2937" }}>R$ {dailyRate.toFixed(2)}</span>
//                 </div>
//                 <div style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center"
//                 }}>
//                   <span style={{ fontSize: 14, color: "#1f2937" }}><strong>Valor Total:</strong></span>
//                   <span style={{ fontSize: 14, color: "#1f2937" }}>R$ {totalValue.toFixed(2)}</span>
//                 </div>
//               </div>
              
//               <div>
//                 <div style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                   marginBottom: 8
//                 }}>
//                   <span style={{ fontSize: 14, color: "#10b981" }}><strong>Pago:</strong></span>
//                   <span style={{ fontSize: 14, color: "#10b981", fontWeight: 600 }}>R$ {paidAmount.toFixed(2)}</span>
//                 </div>
//                 <div style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center"
//                 }}>
//                   <span style={{ fontSize: 14, color: "#f59e0b" }}><strong>Falta Pagar:</strong></span>
//                   <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: 600 }}>R$ {remainingAmount.toFixed(2)}</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Pessoas - layout atualizado conforme as imagens */}
//           <div style={{ marginBottom: 24 }}>
//             <h3 style={{ 
//               margin: "0 0 16px 0", 
//               fontSize: 18, 
//               fontWeight: 600, 
//               color: "#1f2937",
//               background: "#f3f4f6",
//               padding: "12px 16px",
//               marginLeft: "-24px",
//               marginRight: "-24px"
//             }}>
//               Pessoas
//             </h3>
            
//             <div style={{
//               background: "#ffffff",
//               overflow: "hidden"
//             }}>
//               {guests.map((guest, index) => (
//                 <div key={guest.id} style={{
//                   display: "flex",
//                   alignItems: "flex-start",
//                   padding: "20px 0",
//                   borderBottom: index < guests.length - 1 ? "1px solid #e5e7eb" : "none"
//                 }}>
//                   <div style={{ marginRight: 16, position: "relative" }}>
//                     <img
//                       src={`https://i.pravatar.cc/80?u=${guest.id}`}
//                       alt={guest.name}
//                       style={{
//                         width: 80,
//                         height: 80,
//                         borderRadius: "50%"
//                       }}
//                     />
//                     {guest.isRepresentative && (
//                       <div style={{
//                         position: "absolute",
//                         bottom: -8,
//                         left: "50%",
//                         transform: "translateX(-50%)",
//                         background: "#3b82f6",
//                         color: "white",
//                         padding: "4px 12px",
//                         borderRadius: 12,
//                         fontSize: 12,
//                         fontWeight: 500,
//                         whiteSpace: "nowrap"
//                       }}>
//                         Titular
//                       </div>
//                     )}
//                   </div>
                  
//                   <div style={{ flex: 1 }}>
//                     <h4 style={{ 
//                       margin: "0 0 12px 0", 
//                       fontSize: 18, 
//                       fontWeight: 600, 
//                       color: "#1f2937" 
//                     }}>
//                       {guest.name}
//                     </h4>
                    
//                     <div style={{
//                       display: "grid",
//                       gridTemplateColumns: "repeat(2, 1fr)",
//                       gap: "8px 32px",
//                       fontSize: 14,
//                       color: "#4b5563"
//                     }}>
//                       <div>
//                         <strong>CPF:</strong> {guest.cpf}
//                       </div>
//                       <div>
//                         <strong>Nascimento:</strong> {guest.birthDate} (21 anos)
//                       </div>
                      
//                       <div>
//                         <strong>Telefone:</strong> {guest.phone}
//                       </div>
//                       <div>
//                         <strong>RG:</strong> {guest.rg}
//                       </div>
                      
//                       <div>
//                         <strong>Email:</strong> {guest.email}
//                       </div>
//                       <div>
//                         <strong>Gênero:</strong> {guest.gender}
//                       </div>
                      
//                       <div>
//                         <strong>Nacionalidade:</strong> {guest.nationality}
//                       </div>
//                       <div>
//                         <strong>Estado Civil:</strong> Solteira
//                       </div>
                      
//                       <div style={{ gridColumn: "1 / -1" }}>
//                         <strong>Profissão:</strong> {guest.profession}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Pagamentos */}
//           <div>
//             <h3 style={{ 
//               margin: "0 0 16px 0", 
//               fontSize: 18, 
//               fontWeight: 600, 
//               color: "#1f2937" 
//             }}>
//               Pagamentos
//             </h3>
            
//             <div style={{
//               background: "#f9fafb",
//               borderRadius: 8,
//               padding: 16
//             }}>
//               <div style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center"
//               }}>
//                 <div>
//                   <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 4 }}>
//                     Pagamento de 50%
//                   </div>
//                   <div style={{ fontSize: 12, color: "#6b7280" }}>
//                     07/04/2025 15:09 CARTÃO DE CRÉDITO
//                   </div>
//                 </div>
//                 <div style={{ fontSize: 16, fontWeight: 600, color: "#1f2937" }}>
//                   R$ {paidAmount.toFixed(2)}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// }

// function ModernDashboard({ reservations, rooms, selectedDay, viewDate }) {
//   const today = new Date();
//   const currentMonth = viewDate.getMonth();
//   const currentYear = viewDate.getFullYear();
  
//   // Estado para o modal de solicitação
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [requestModalOpen, setRequestModalOpen] = useState(false);

//   const stats = useMemo(() => {
//     const selectedDayKey = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`;
    
//     // Reservas do dia selecionado
//     const dayReservations = reservations.filter(r => 
//       selectedDayKey >= r.start && selectedDayKey <= r.end
//     );
    
//     // Reservas do mês atual
//     const monthReservations = reservations.filter(r => {
//       const startDate = new Date(r.start);
//       const endDate = new Date(r.end);
//       return (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) ||
//              (endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear) ||
//              (startDate <= new Date(currentYear, currentMonth, 1) && endDate >= new Date(currentYear, currentMonth + 1, 0));
//     });

//     // Próximas chegadas (próximos 7 dias)
//     const upcomingArrivals = reservations.filter(r => {
//       const startDate = new Date(r.start);
//       const diffTime = startDate.getTime() - today.getTime();
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       return diffDays >= 0 && diffDays <= 7;
//     });

//     // Próximas partidas (próximos 7 dias)
//     const upcomingDepartures = reservations.filter(r => {
//       const endDate = new Date(r.end);
//       const diffTime = endDate.getTime() - today.getTime();
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       return diffDays >= 0 && diffDays <= 7;
//     });

//     // Taxa de ocupação do mês
//     const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
//     const totalRoomDays = rooms.length * daysInMonth;
//     const occupiedRoomDays = monthReservations.reduce((acc, res) => {
//       const start = new Date(Math.max(new Date(res.start).getTime(), new Date(currentYear, currentMonth, 1).getTime()));
//       const end = new Date(Math.min(new Date(res.end).getTime(), new Date(currentYear, currentMonth + 1, 0).getTime()));
//       return acc + Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
//     }, 0);
//     const occupancyRate = Math.round((occupiedRoomDays / totalRoomDays) * 100);

//     // Receita estimada do mês
//     const monthRevenue = monthReservations.reduce((acc, res) => {
//       const start = new Date(Math.max(new Date(res.start).getTime(), new Date(currentYear, currentMonth, 1).getTime()));
//       const end = new Date(Math.min(new Date(res.end).getTime(), new Date(currentYear, currentMonth + 1, 0).getTime()));
//       const nights = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
//       return acc + (nights * 80); // R$ 80 por noite
//     }, 0);

//     return {
//       // Dia selecionado
//       dayOccupied: dayReservations.length,
//       dayAvailable: rooms.length - dayReservations.length,
//       dayOccupancyRate: Math.round((dayReservations.length / rooms.length) * 100),
      
//       // Mês atual
//       monthReservations: monthReservations.length,
//       occupancyRate,
//       monthRevenue,
      
//       // Próximos eventos
//       upcomingArrivals: upcomingArrivals.length,
//       upcomingDepartures: upcomingDepartures.length,
      
//       // Quartos
//       totalRooms: rooms.length,
      
//       // Listas para detalhes
//       arrivalsList: upcomingArrivals.slice(0, 3),
//       departuresList: upcomingDepartures.slice(0, 3)
//     };
//   }, [reservations, rooms, selectedDay, currentMonth, currentYear, today]);

//   const handleRequestClick = (reservation) => {
//     setSelectedRequest(reservation);
//     setRequestModalOpen(true);
//   };

//   const handleConfirmReservation = () => {
//     // Aqui você adicionaria a lógica para confirmar a reserva
//     console.log('Reserva confirmada:', selectedRequest);
//     setRequestModalOpen(false);
//     setSelectedRequest(null);
//   };

//   const handleCancelReservation = () => {
//     // Aqui você adicionaria a lógica para cancelar a reserva
//     console.log('Reserva cancelada:', selectedRequest);
//     setRequestModalOpen(false);
//     setSelectedRequest(null);
//   };

//   const StatCard = ({ title, value, subtitle, color = '#4f8c79', icon }) => (
//     <div style={{
//       background: '#ffffff',
//       borderRadius: 16,
//       padding: 24,
//       border: '1px solid #e2e8f0',
//       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
//       transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//       cursor: 'pointer'
//     }}
//     onMouseEnter={(e) => {
//       e.currentTarget.style.transform = 'translateY(-2px)';
//       e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
//     }}
//     onMouseLeave={(e) => {
//       e.currentTarget.style.transform = 'translateY(0)';
//       e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
//     }}
//     >
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
//         <div style={{
//           background: `${color}20`,
//           borderRadius: 12,
//           width: 48,
//           height: 48,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           fontSize: 24
//         }}>
//           {icon}
//         </div>
//         <div style={{ textAlign: 'right' }}>
//           <div style={{
//             fontSize: 28,
//             fontWeight: 700,
//             color: '#1a202c',
//             lineHeight: 1
//           }}>
//             {value}
//           </div>
//         </div>
//       </div>
//       <div>
//         <div style={{
//           fontSize: 14,
//           fontWeight: 600,
//           color: '#4a5568',
//           marginBottom: 4
//         }}>
//           {title}
//         </div>
//         <div style={{
//           fontSize: 12,
//           color: '#718096'
//         }}>
//           {subtitle}
//         </div>
//       </div>
//     </div>
//   );

//   const ProgressBar = ({ value, max, color = '#4f8c79' }) => (
//     <div style={{
//       width: '100%',
//       height: 8,
//       backgroundColor: '#e2e8f0',
//       borderRadius: 4,
//       overflow: 'hidden'
//     }}>
//       <div style={{
//         width: `${Math.min(100, (value / max) * 100)}%`,
//         height: '100%',
//         backgroundColor: color,
//         borderRadius: 4,
//         transition: 'width 0.3s ease'
//       }} />
//     </div>
//   );

//   return (
//     <>
//       <div style={{ marginBottom: 24 }}>
//         {/* Cards principais */}
//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
//           gap: 20,
//           marginBottom: 24
//         }}>
//           <StatCard
//             title="Ocupação Hoje"
//             value={`${stats.dayOccupied}/${stats.totalRooms}`}
//             subtitle={`${stats.dayOccupancyRate}% de ocupação`}
//             color="#4f8c79"
//             icon="🏨"
//           />
          
//           <StatCard
//             title="Taxa de Ocupação Mensal"
//             value={`${stats.occupancyRate}%`}
//             subtitle={`${stats.monthReservations} reservas este mês`}
//             color="#3182ce"
//             icon="📊"
//           />
          
//           <StatCard
//             title="Receita Estimada"
//             value={`R$ ${stats.monthRevenue.toLocaleString('pt-BR')}`}
//             subtitle="Receita do mês atual"
//             color="#38a169"
//             icon="💰"
//           />
          
//           <StatCard
//             title="Reservas Solicitadas pelo site"
//             value={stats.upcomingArrivals}
//             subtitle="Nos próximos 7 dias"
//             color="#ed8936"
//             icon="📅"
//           />
          
//           <StatCard
//             title="Hóspedes Hoje"
//             value={stats.dayOccupied}
//             subtitle="Total de pessoas hospedadas"
//             color="#805ad5"
//             icon="👥"
//           />
//         </div>

//         {/* Seção de detalhes */}
//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
//           gap: 20
//         }}>
//           {/* Próximas chegadas - agora com botões */}
//           <div style={{
//             background: '#ffffff',
//             borderRadius: 16,
//             padding: 24,
//             border: '1px solid #e2e8f0',
//             boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
//           }}>
//             <div style={{
//               display: 'flex',
//               alignItems: 'center',
//               marginBottom: 20
//             }}>
//               <div style={{ fontSize: 20, marginRight: 12 }}>📋</div>
//               <h3 style={{ 
//                 margin: 0, 
//                 fontSize: 18, 
//                 fontWeight: 600, 
//                 color: '#2d3748' 
//               }}>
//                 Reservas Solicitadas pelo site
//               </h3>
//             </div>
            
//             {stats.arrivalsList.length > 0 ? (
//               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//                 {stats.arrivalsList.map((res, idx) => (
//                   <button
//                     key={res.id}
//                     onClick={() => handleRequestClick(res)}
//                     style={{
//                       display: 'flex',
//                       justifyContent: 'space-between',
//                       alignItems: 'center',
//                       padding: 12,
//                       background: '#f7fafc',
//                       borderRadius: 8,
//                       border: '1px solid #e2e8f0',
//                       cursor: 'pointer',
//                       transition: 'all 0.2s ease',
//                       width: '100%',
//                       textAlign: 'left'
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.background = '#edf2f7';
//                       e.currentTarget.style.transform = 'translateY(-1px)';
//                       e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.background = '#f7fafc';
//                       e.currentTarget.style.transform = 'translateY(0)';
//                       e.currentTarget.style.boxShadow = 'none';
//                     }}
//                   >
//                     <div>
//                       <div style={{ fontWeight: 600, fontSize: 14, color: '#2d3748' }}>
//                         Quarto {String(res.roomId).padStart(2, '0')}
//                       </div>
//                       <div style={{ fontSize: 12, color: '#718096' }}>
//                         {res.title.substring(0, 25)}...
//                       </div>
//                     </div>
//                     <div style={{ textAlign: 'right' }}>
//                       <div style={{ fontSize: 12, fontWeight: 600, color: '#4f8c79' }}>
//                         {new Date(res.start).toLocaleDateString('pt-BR')}
//                       </div>
//                       <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
//                         Clique para ver detalhes
//                       </div>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             ) : (
//               <div style={{ 
//                 textAlign: 'center', 
//                 color: '#718096', 
//                 padding: 20,
//                 fontSize: 14 
//               }}>
//                 Nenhuma chegada programada
//               </div>
//             )}
//           </div>

//           {/* Status dos quartos */}
//           <div style={{
//             background: '#ffffff',
//             borderRadius: 16,
//             padding: 24,
//             border: '1px solid #e2e8f0',
//             boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
//           }}>
//             <div style={{
//               display: 'flex',
//               alignItems: 'center',
//               marginBottom: 20
//             }}>
//               <div style={{ fontSize: 20, marginRight: 12 }}>🔑</div>
//               <h3 style={{ 
//                 margin: 0, 
//                 fontSize: 18, 
//                 fontWeight: 600, 
//                 color: '#2d3748' 
//               }}>
//                 Status dos Quartos Hoje
//               </h3>
//             </div>
            
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//               <div>
//                 <div style={{ 
//                   display: 'flex', 
//                   justifyContent: 'space-between', 
//                   marginBottom: 8 
//                 }}>
//                   <span style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>
//                     Ocupados
//                   </span>
//                   <span style={{ fontSize: 14, color: '#718096' }}>
//                     {stats.dayOccupied}/{stats.totalRooms}
//                   </span>
//                 </div>
//                 <ProgressBar 
//                   value={stats.dayOccupied} 
//                   max={stats.totalRooms} 
//                   color="#e53e3e" 
//                 />
//               </div>
              
//               <div>
//                 <div style={{ 
//                   display: 'flex', 
//                   justifyContent: 'space-between', 
//                   marginBottom: 8 
//                 }}>
//                   <span style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>
//                     Disponíveis
//                   </span>
//                   <span style={{ fontSize: 14, color: '#718096' }}>
//                     {stats.dayAvailable}/{stats.totalRooms}
//                   </span>
//                 </div>
//                 <ProgressBar 
//                   value={stats.dayAvailable} 
//                   max={stats.totalRooms} 
//                   color="#38a169" 
//                 />
//               </div>
//             </div>

//             <div style={{
//               marginTop: 20,
//               padding: 16,
//               background: '#f0fff4',
//               borderRadius: 8,
//               border: '1px solid #c6f6d5'
//             }}>
//               <div style={{ 
//                 fontSize: 14, 
//                 fontWeight: 600, 
//                 color: '#2f855a',
//                 textAlign: 'center'
//               }}>
//                 Taxa de Ocupação: {stats.dayOccupancyRate}%
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modal de Solicitação de Reserva */}
//       <ReservationRequestModal
//         open={requestModalOpen}
//         onClose={() => {
//           setRequestModalOpen(false);
//           setSelectedRequest(null);
//         }}
//         reservation={selectedRequest}
//         onConfirm={handleConfirmReservation}
//         onCancel={handleCancelReservation}
//       />
//     </>
//   );
// }

// export default ModernDashboard;