using FluentResults;
using System;
using System.Linq;

namespace ZapAgenda_api_aspnet.helpers
{
    public class ValidaCnpj
    {
        public static Result Validar(string cnpj)
        {
            cnpj = cnpj?.Replace(".", "").Replace("/", "").Replace("-", "");

            if (cnpj.Length != 14)
            {
                return Result.Fail("CNPJ deve ter exatamente 14 caracteres.");
            }

            if (cnpj.All(c => c == cnpj[0]))
            {
                return Result.Fail("CNPJ com números repetidos não é válido.");
            }

            int[] multiplicador1 = new int[] { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] multiplicador2 = new int[] { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

            int soma1 = 0;
            for (int i = 0; i < 12; i++)
            {
                soma1 += int.Parse(cnpj[i].ToString()) * multiplicador1[i];
            }
            int resto1 = soma1 % 11;
            int digito1 = resto1 < 2 ? 0 : 11 - resto1;

            int soma2 = 0;
            for (int i = 0; i < 13; i++)
            {
                soma2 += int.Parse(cnpj[i].ToString()) * multiplicador2[i];
            }
            int resto2 = soma2 % 11;
            int digito2 = resto2 < 2 ? 0 : 11 - resto2;

            if (cnpj[12] != digito1.ToString()[0] || cnpj[13] != digito2.ToString()[0])
            {
                return Result.Fail("CNPJ inválido: dígitos verificadores não correspondem.");
            }

            return Result.Ok();
        }
    }
}
