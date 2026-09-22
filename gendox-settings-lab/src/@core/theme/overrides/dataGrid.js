// src/theme/overrides/dataGrid.js

export default (theme) => {
  return {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 0,
          color: theme.palette.text.primary,
          '--DataGrid-containerBackground': 'none'
        },
        columnHeaders: {
          backgroundColor: theme.palette.customColors.tableHeaderBg
        },
        columnHeader: {
          '&:not(.MuiDataGrid-columnHeaderCheckbox)': {
            paddingLeft: theme.spacing(4),
            paddingRight: theme.spacing(4),
          },
        },
        columnHeaderTitle: {
          fontSize: '0.75rem',
        },
        cell: {
          display: 'flex',
          alignItems: 'center',
          '&:focus': {
            outline: 'none !important',
            outlineOffset: 0
          },

        }
        // ... add more overrides as needed
      }
    }
  }
}
