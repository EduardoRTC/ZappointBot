using ZapAgenda_api_aspnet.Dtos.ProfissionalSaude;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.Mappers
{
    public static class ProfissionalSaudeMapper
    {
        public static ProfissionalSaude ToProfissionalSaude(this CreateProfissionalSaudeDto dto, int idUsuario)
        {
            return new ProfissionalSaude
            {
                IdUsuario = idUsuario,
                TipoConselho = dto.TipoConselho,
                RegistroConselho = dto.RegistroConselho,
                Especialidade = dto.Especialidade
            };
        }
    }
}
