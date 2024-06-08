import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import GendoxAppBrand from "./GendoxAppBrand";
import Link from "next/link";
import properties  from "src/configs/frontend-properties.js";

const PoweredByGendox = () => {
    return (
        <Link href={properties.gendoxHomePage} passHref target="_blank" style={{ textDecoration: 'none',
            display: 'flex',
            justifyContent: 'center'}}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                }}
            >
                <Typography>{`Powered by  `}</Typography>
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
        </Link>

    )
}

export default PoweredByGendox

