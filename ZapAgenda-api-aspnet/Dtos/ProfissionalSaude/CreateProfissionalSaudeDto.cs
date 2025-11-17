namespace ZapAgenda_api_aspnet.Dtos.ProfissionalSaude
{
    public class CreateProfissionalSaudeDto
    {
        public int IdUsuario { get; set; }
        public string TipoConselho { get; set; } = string.Empty;
        public string RegistroConselho { get; set; } = string.Empty;
        public string Especialidade { get; set; } = string.Empty;
    }
}