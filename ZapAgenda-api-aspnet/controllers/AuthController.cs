using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.repositories.interfaces;
using ZapAgenda_api_aspnet.services.interfaces;

namespace ZapAgenda_api_aspnet.controllers
{
    [Route("{IdEmpresa}/autentificacao")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IUsuarioRepository _usuarioRepo;
        private readonly ICriptografarService _cryptService;
        private readonly ITokenService _tokenService;

        public AuthController(
            IConfiguration configuration,
            IUsuarioRepository usuarioRepo,
            ICriptografarService cryptService,
            ITokenService tokenService)
        {
            _configuration = configuration;
            _usuarioRepo = usuarioRepo;
            _cryptService = cryptService;
            _tokenService = tokenService;
        }

        [HttpPost]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto, Guid IdEmpresa)
        {
            var usuario = await _usuarioRepo
                .GetUsariosByEmpresaAndNomeUsuario(IdEmpresa, loginDto.NomeUsuario);

            if (usuario.IsFailed)
                return NotFound("Credenciais inválidas");

            var usuarioValores = usuario.Value;

            if (usuarioValores.Status == true)
                return BadRequest("Usuário está desativado");

            var senhaValida = _cryptService.VerifySenha(loginDto.Senha, usuarioValores.Senha);
            if (senhaValida.IsFailed)
                return Unauthorized("Senha incorreta");

            var usuarioDto = new UsuarioDto
            {
                Cpf = usuarioValores.Cpf,
                Email = usuarioValores.Email,
                IdCargo = usuarioValores.IdCargo,
                Id = usuarioValores.IdUsuario,
                NomeInteiro = usuarioValores.NomeInteiro,
                NomeUsuario = usuarioValores.NomeUsuario,
                IdEmpresa = IdEmpresa
            };

            var token = _tokenService.CreateToken(usuarioDto);

            // 👉 Agora retorna o token no response body
            return Ok(new
            {
                accessToken = token,
                usuario = usuarioDto
            });
        }
    }
}
