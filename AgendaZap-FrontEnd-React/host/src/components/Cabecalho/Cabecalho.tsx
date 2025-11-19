import { AppBar, Toolbar, Box, Typography } from "@mui/material";
import egLogo from "../../assets/EgLogo.png";

export const Cabecalho = () => {
  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#0F1938", // 🔥 cor solicitada
        paddingY: 1,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "flex-end", // 🔥 tudo alinhado à direita
          alignItems: "center",
          gap: 2, // espaço entre logo e texto
        }}
      >
        {/* Texto */}
        <Typography
          variant="body1"
          sx={{
            textAlign: "right",
            lineHeight: 1.2,
            fontWeight: 500,
            color: "#FFFFFF",
          }}
        >
          Sistemas de Agendamento
        </Typography>

        {/* Logo */}
        <Box
          component="img"
          src={egLogo}
          alt="Logo com a letra E e a letra G"
          sx={{
            width: 55,
            height: "auto",
          }}
        />
      </Toolbar>
    </AppBar>
  );
};
