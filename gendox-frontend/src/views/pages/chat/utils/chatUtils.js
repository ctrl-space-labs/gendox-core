import CustomAvatar from 'src/views/custom-components/mui/avatar'

export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

export const sortThreadsByDate = (threads) => {
  return threads.sort(
    (a, b) => new Date(b.latestMessageCreatedAt) - new Date(a.latestMessageCreatedAt)
  );
};

export const AgentAvatar = ({ fullName, isSelected }) => (
  <CustomAvatar skin={isSelected ? 'light-static' : 'light'} color='primary' sx={{ height: '2.5rem', width: '2.5rem' }}>
    {fullName?.charAt(0) || ' '}
  </CustomAvatar>
);
