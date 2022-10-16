import { Box, Button } from '@mui/material';

import reactLogo from './assets/react.svg';
import { useState } from 'react';

function App() {
  const [joined, setJoined] = useState(false);

  return <Box>{!joined && <Button>Join room</Button>}</Box>;
}

export default App;
