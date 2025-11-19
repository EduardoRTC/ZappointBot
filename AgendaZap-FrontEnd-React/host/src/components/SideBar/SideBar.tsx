import { Link, useParams } from "react-router-dom";
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Toolbar,
    useMediaQuery,
    Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import { FaChartLine, FaRegCalendarCheck, FaWrench } from "react-icons/fa";
import { IoIosChatboxes } from "react-icons/io";
import { CiUser } from "react-icons/ci";
import { FaClipboardUser, FaGear } from "react-icons/fa6";
import { useState } from "react";

const drawerWidth = 240;

export const SideBar = () => {
    const { idEmpresa } = useParams<{ idEmpresa: string }>();

    const isMobile = useMediaQuery("(max-width: 900px)");
    const [open, setOpen] = useState(false);

    const menuItems = [
        { label: "Agenda", icon: <FaRegCalendarCheck size={22} />, path: `${idEmpresa}/home` },
        { label: "Chat", icon: <IoIosChatboxes size={22} />, path: `${idEmpresa}/chat` },
        { label: "Funcionários", icon: <FaClipboardUser size={22} />, path: `${idEmpresa}/funcionarios` },
        { label: "Clientes", icon: <CiUser size={22} />, path: `${idEmpresa}/clientes` },
        { label: "Serviços", icon: <FaWrench size={22} />, path: `${idEmpresa}/servico` },
        { label: "Relatórios", icon: <FaChartLine size={22} />, path: `${idEmpresa}/relatorios` },
        { label: "Configurações", icon: <FaGear size={22} />, path: `${idEmpresa}/configuraçoes` },
    ];

    const drawerContent = (
        <Box sx={{ width: drawerWidth, backgroundColor: "#0F1938", height: "100%" }}>
            <Toolbar />
            <List>
                {menuItems.map((item, index) => (
                    <ListItem key={index} disablePadding>
                        <ListItemButton component={Link} to={item.path}>
                            <ListItemIcon sx={{ color: "white" }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} sx={{ color: "white" }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <>
            {isMobile && (
                <IconButton
                    onClick={() => setOpen(true)}
                    sx={{ position: "absolute", top: 10, left: 10, zIndex: 2000, color: "white" }}
                >
                    <MenuIcon />
                </IconButton>
            )}

            {isMobile ? (
                <Drawer
                    variant="temporary"
                    open={open}
                    onClose={() => setOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        "& .MuiDrawer-paper": {
                            width: drawerWidth,
                            backgroundColor: "#0F1938",
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            ) : (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        "& .MuiDrawer-paper": {
                            width: drawerWidth,
                            backgroundColor: "#0F1938",
                            boxSizing: "border-box",
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}
        </>
    );
};
