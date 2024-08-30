import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const GendoxAppBrand = () => {
    return (
        <a href="/gendox/home" style={{ textDecoration: 'none' }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "20px 20px",
                }}
            >
                <div
                    style={{
                        width: "30px",
                        height: "30px",
                        backgroundImage: "url('/images/gendoxLogo.svg')",
                        backgroundSize: "20px 20px",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                    }}
                />
                <Typography
                    variant="h6"
                    sx={{
                        ml: 2,
                    }}
                >
                    Gendox
                </Typography>
            </Box>
        </a>
    );
};

export default GendoxAppBrand;
