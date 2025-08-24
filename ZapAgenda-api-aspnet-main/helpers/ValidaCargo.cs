using FluentResults;

namespace ZapAgenda_api_aspnet.helpers
{
    public class ValidaCargo
    {
        public static Result<bool> ValidaIdCargo(int IdCargo)
        {
            if (IdCargo != 1 || IdCargo != 2 || IdCargo != 3)
            {
                return Result.Fail("Cargo não existe");
            }
            return Result.Ok(true);
        }
    }
}