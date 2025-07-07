import React from 'react'
import { InputAdornment, TextField, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

const SearchBar = ({ value, onChange, placeholder = 'Search...', clearable = false, sx }) => {
  return (
    <TextField
      variant="outlined"
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      sx={sx}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
        endAdornment: clearable && value ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => onChange({ target: { value: '' } })}
              aria-label="clear search"
              edge="end"
            >
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      inputProps={{
        'aria-label': 'search input',
      }}
    />
  )
}

export default SearchBar
