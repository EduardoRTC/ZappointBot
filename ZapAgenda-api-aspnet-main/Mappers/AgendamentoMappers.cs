using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ZapAgenda_api_aspnet.Dtos.Agendamento;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.Mappers
{
    public static class AgendamentoMappers
    {
        public static Agendamento ToCreateAgendamentoDto(this CreateAgendamentoDto createAgendamentoDto)
        {
            return new Agendamento
            {
                DataHoraInicio = createAgendamentoDto.DataHoraInicio,
                IdCliente = createAgendamentoDto.IdCliente,
                IdUsuario = createAgendamentoDto.IdUsuario,
                Observacao = createAgendamentoDto.Observacao,
            };
        }

        public static AgendamentoDto ToAgendamentoDto(this Agendamento agendamento)
        {
            return new AgendamentoDto
            {
                DataHoraFim = agendamento.DataHoraFim,
                DataHoraInicio = agendamento.DataHoraInicio,
                IdAgendamento = agendamento.Id,
                IdCliente = agendamento.IdCliente,
                IdUsuario = agendamento.IdUsuario,
                Observacao = agendamento.Observacao,
                StatusAgendamento = agendamento.StatusAgendamento,
                TempoDuracaoAgendamento = agendamento.TempoDuracaoAgendamento,
                ValorTotal = agendamento.ValorTotal,
                Cliente = agendamento.Cliente.ToClienteDto(),
                Usuario = agendamento.Usuario.ToUsuarioDto()
            };
        }
    }
}