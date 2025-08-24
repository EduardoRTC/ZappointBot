using FluentResults;

namespace ZapAgenda_api_aspnet.helpers
{
    public class VerificaEmpresa
    {
        public static Result<bool> PertenceEmpresa(Guid id, Guid IdEmpresa)
        {
            if (id != IdEmpresa)
            {
                return Result.Fail($"Não pertence a empresa de id:{IdEmpresa}");
            }
            return Result.Ok(true);
        }
    }
}