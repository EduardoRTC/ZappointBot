using ZapAgenda_api_aspnet.Dtos.Servico;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.Mappers
{
    public static class ServicoMappers
    {
        public static Servico ToCreateServicoDto(this CreateServicoDto createServicoDto)
        {
            return new Servico
            {
                Descricao = createServicoDto.Descricao,
                Valor = createServicoDto.Valor,
                TempoDuracao = createServicoDto.TempoDuracao,
            };
        }

        public static ServicoDto ToServicoDto(this Servico servico)
        {
            return new ServicoDto
            {
                Id = servico.Id,
                Descricao = servico.Descricao,
                Valor = servico.Valor,
                TempoDuracao = servico.TempoDuracao,
                IdEmpresa = servico.IdEmpresa
            };
        }
    }
}
