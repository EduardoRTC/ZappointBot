using FluentResults;
using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.services.implementantions
{
    public static class VerificaDados
    {
        public static Result<bool> VerificaUsuario(List<Usuario> usuariosEmpresa, Usuario usuarioModel)
        {

            var nomeUsuarioIgual = usuariosEmpresa.FirstOrDefault(usuario => usuario.NomeUsuario == usuarioModel.NomeUsuario && usuarioModel.Status == true);
            if (nomeUsuarioIgual != null)
            {
                return Result.Fail("Não pode ter usuários com o mesmo nome de usuário.");
            }
            return Result.Ok(true);
        }

        public static Result<bool> VerificaSenha(string senha)
        {
            if (senha.Length < 8)
            {
                return Result.Fail("Senha não pode ser menor que 8 caracteres");
            }
            if (!senha.Any(char.IsUpper))
            {
                return Result.Fail("Senha precisa ter 1 caracter em maiúsculo");
            }
            if (!senha.Any(char.IsLetter))
            {
                return Result.Fail("Senha precisa ter letras");
            }
            if (!senha.Any(char.IsDigit))
            {
                return Result.Fail("Senha precisa ter digitos");
            }
            return Result.Ok(true);
        }


        public static Result<bool> VerificaCpf(string cpf)
        {
            if (string.IsNullOrWhiteSpace(cpf))
            {
                return Result.Fail("CPF não pode ser vazio.");
            }


            if (cpf.Length != 11)
            {
                return Result.Fail("CPF deve conter 11 dígitos.");
            }

            if (new string(cpf[0], cpf.Length) == cpf)
            {
                return Result.Fail("CPF inválido.");
            }

            int[] multiplicadores1 = { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] multiplicadores2 = { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };

            string cpfParcial = cpf.Substring(0, 9);
            int primeiroDigito = CalculaDigitoVerificador(cpfParcial, multiplicadores1);
            int segundoDigito = CalculaDigitoVerificador(cpfParcial + primeiroDigito, multiplicadores2);

            string cpfCalculado = cpfParcial + primeiroDigito + segundoDigito;

            if (cpf == cpfCalculado)
            {
                return Result.Ok(true);
            }
            else
            {
                return Result.Fail("CPF inválido.");
            }
        }

        private static int CalculaDigitoVerificador(string cpf, int[] multiplicadores)
        {
            int soma = 0;
            for (int i = 0; i < multiplicadores.Length; i++)
            {
                soma += (cpf[i] - '0') * multiplicadores[i];
            }

            int resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        }

    }
}