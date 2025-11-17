using FluentResults;
using ZapAgenda_api_aspnet.services.interfaces;

namespace ZapAgenda_api_aspnet.services
{
    public class CriptografarService : ICriptografarService
    {
        public string HashSenha(string senha)
        {
            return BCrypt.Net.BCrypt.HashPassword(senha, 13);
        }

        public Result<bool> VerifySenha(string senha, string hashSenha)
        {
            if (string.IsNullOrWhiteSpace(senha))
                return Result.Fail("A senha fornecida é inválida.");

            if (string.IsNullOrWhiteSpace(hashSenha) || !hashSenha.StartsWith("$2"))
                return Result.Fail("O hash de senha fornecido é inválido, verificar se está sendo passado a senha criptograda");

            bool isValid = BCrypt.Net.BCrypt.Verify(senha,hashSenha);

            return isValid
                ? Result.Ok(true)
                : Result.Fail("Credencias invalidas");
        }
    }
}