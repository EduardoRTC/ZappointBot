using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentResults;

namespace ZapAgenda_api_aspnet.services.interfaces
{
    public interface ICriptografarService
    {
        string HashSenha(string senha);
        Result<bool> VerifySenha(string senha, string hashSenha);
    }
}