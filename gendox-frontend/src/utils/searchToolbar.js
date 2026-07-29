import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';

import Icon from 'src/views/custom-components/mui/icon/icon';

const SearchToolbar = (props) => {
  return (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: props.leftContent ? 'space-between' : 'flex-end',
        p: '1rem'
      }}
    >
      {props.leftContent ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>{props.leftContent}</Box> : null}

      <TextField
        size="small"
        value={props.value}
        onChange={props.onChange}
        placeholder="Search…"
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 2, display: 'flex' }}>
              <Icon icon="mdi:magnify" fontSize={20} />
            </Box>
          ),
          endAdornment: (
            <IconButton size="small" title="Clear" aria-label="Clear" onClick={props.clearSearch}>
              <Icon icon="mdi:close" fontSize={20} />
            </IconButton>
          ),
        }}
      />
    </Box>
  );
};

export default SearchToolbar;
