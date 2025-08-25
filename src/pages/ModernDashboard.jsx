// Dashboard component - adicione antes do calendário
import React, { useMemo } from 'react';

function ModernDashboard({ reservations, rooms, selectedDay, viewDate }) {
  const today = new Date();
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const stats = useMemo(() => {
    const selectedDayKey = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`;
    
    // Reservas do dia selecionado
    const dayReservations = reservations.filter(r => 
      selectedDayKey >= r.start && selectedDayKey <= r.end
    );
    
    // Reservas do mês atual
    const monthReservations = reservations.filter(r => {
      const startDate = new Date(r.start);
      const endDate = new Date(r.end);
      return (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) ||
             (endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear) ||
             (startDate <= new Date(currentYear, currentMonth, 1) && endDate >= new Date(currentYear, currentMonth + 1, 0));
    });

    // Próximas chegadas (próximos 7 dias)
    const upcomingArrivals = reservations.filter(r => {
      const startDate = new Date(r.start);
      const diffTime = startDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });

    // Próximas partidas (próximos 7 dias)
    const upcomingDepartures = reservations.filter(r => {
      const endDate = new Date(r.end);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });

    // Taxa de ocupação do mês
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const totalRoomDays = rooms.length * daysInMonth;
    const occupiedRoomDays = monthReservations.reduce((acc, res) => {
      const start = new Date(Math.max(new Date(res.start).getTime(), new Date(currentYear, currentMonth, 1).getTime()));
      const end = new Date(Math.min(new Date(res.end).getTime(), new Date(currentYear, currentMonth + 1, 0).getTime()));
      return acc + Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    }, 0);
    const occupancyRate = Math.round((occupiedRoomDays / totalRoomDays) * 100);

    // Receita estimada do mês
    const monthRevenue = monthReservations.reduce((acc, res) => {
      const start = new Date(Math.max(new Date(res.start).getTime(), new Date(currentYear, currentMonth, 1).getTime()));
      const end = new Date(Math.min(new Date(res.end).getTime(), new Date(currentYear, currentMonth + 1, 0).getTime()));
      const nights = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      return acc + (nights * 80); // R$ 80 por noite
    }, 0);

    return {
      // Dia selecionado
      dayOccupied: dayReservations.length,
      dayAvailable: rooms.length - dayReservations.length,
      dayOccupancyRate: Math.round((dayReservations.length / rooms.length) * 100),
      
      // Mês atual
      monthReservations: monthReservations.length,
      occupancyRate,
      monthRevenue,
      
      // Próximos eventos
      upcomingArrivals: upcomingArrivals.length,
      upcomingDepartures: upcomingDepartures.length,
      
      // Quartos
      totalRooms: rooms.length,
      
      // Listas para detalhes
      arrivalsList: upcomingArrivals.slice(0, 3),
      departuresList: upcomingDepartures.slice(0, 3)
    };
  }, [reservations, rooms, selectedDay, currentMonth, currentYear, today]);

  const StatCard = ({ title, value, subtitle, color = '#4f8c79', icon }) => (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      padding: 24,
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          background: `${color}20`,
          borderRadius: 12,
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24
        }}>
          {icon}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#1a202c',
            lineHeight: 1
          }}>
            {value}
          </div>
        </div>
      </div>
      <div>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#4a5568',
          marginBottom: 4
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 12,
          color: '#718096'
        }}>
          {subtitle}
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ value, max, color = '#4f8c79' }) => (
    <div style={{
      width: '100%',
      height: 8,
      backgroundColor: '#e2e8f0',
      borderRadius: 4,
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${Math.min(100, (value / max) * 100)}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: 4,
        transition: 'width 0.3s ease'
      }} />
    </div>
  );

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Cards principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        marginBottom: 24
      }}>
        <StatCard
          title="Ocupação Hoje"
          value={`${stats.dayOccupied}/${stats.totalRooms}`}
          subtitle={`${stats.dayOccupancyRate}% de ocupação`}
          color="#4f8c79"
          icon="🏨"
        />
        
        <StatCard
          title="Taxa de Ocupação Mensal"
          value={`${stats.occupancyRate}%`}
          subtitle={`${stats.monthReservations} reservas este mês`}
          color="#3182ce"
          icon="📊"
        />
        
        <StatCard
          title="Receita Estimada"
          value={`R$ ${stats.monthRevenue.toLocaleString('pt-BR')}`}
          subtitle="Receita do mês atual"
          color="#38a169"
          icon="💰"
        />
        
        <StatCard
          title="Próximas Chegadas"
          value={stats.upcomingArrivals}
          subtitle="Nos próximos 7 dias"
          color="#ed8936"
          icon="📅"
        />
        
        <StatCard
          title="Hóspedes Hoje"
          value={stats.dayOccupied}
          subtitle="Total de pessoas hospedadas"
          color="#805ad5"
          icon="👥"
        />
      </div>

      {/* Seção de detalhes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 20
      }}>
        {/* Próximas chegadas */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <div style={{ fontSize: 20, marginRight: 12 }}>📋</div>
            <h3 style={{ 
              margin: 0, 
              fontSize: 18, 
              fontWeight: 600, 
              color: '#2d3748' 
            }}>
              Próximas Chegadas
            </h3>
          </div>
          
          {stats.arrivalsList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.arrivalsList.map((res, idx) => (
                <div key={res.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  background: '#f7fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#2d3748' }}>
                      Quarto {String(res.roomId).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 12, color: '#718096' }}>
                      {res.title.substring(0, 25)}...
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#4f8c79' }}>
                      {new Date(res.start).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: '#718096', 
              padding: 20,
              fontSize: 14 
            }}>
              Nenhuma chegada programada
            </div>
          )}
        </div>

        {/* Status dos quartos */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <div style={{ fontSize: 20, marginRight: 12 }}>🔑</div>
            <h3 style={{ 
              margin: 0, 
              fontSize: 18, 
              fontWeight: 600, 
              color: '#2d3748' 
            }}>
              Status dos Quartos Hoje
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 8 
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>
                  Ocupados
                </span>
                <span style={{ fontSize: 14, color: '#718096' }}>
                  {stats.dayOccupied}/{stats.totalRooms}
                </span>
              </div>
              <ProgressBar 
                value={stats.dayOccupied} 
                max={stats.totalRooms} 
                color="#e53e3e" 
              />
            </div>
            
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 8 
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>
                  Disponíveis
                </span>
                <span style={{ fontSize: 14, color: '#718096' }}>
                  {stats.dayAvailable}/{stats.totalRooms}
                </span>
              </div>
              <ProgressBar 
                value={stats.dayAvailable} 
                max={stats.totalRooms} 
                color="#38a169" 
              />
            </div>
          </div>

          <div style={{
            marginTop: 20,
            padding: 16,
            background: '#f0fff4',
            borderRadius: 8,
            border: '1px solid #c6f6d5'
          }}>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#2f855a',
              textAlign: 'center'
            }}>
              Taxa de Ocupação: {stats.dayOccupancyRate}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModernDashboard;