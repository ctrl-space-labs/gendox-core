Create a new frontend page for Gendox.

The user wants to create: $ARGUMENTS

Follow the existing Next.js + shadcn/ui architecture:

1. **Page component** in `gendox-frontend/src/pages/gendox/`
   - Use the file-system routing convention
   - Wrap with appropriate layout (UserLayout or GendoxChatLayout)
   - Add authentication guard if needed (OrganizationProjectGuard, PrivateRoute)

2. **View components** in `gendox-frontend/src/views/pages/`
   - Feature-based organization
   - Use shadcn/ui components from `@/components/ui/`
   - Use Tailwind CSS for styling with theme CSS variables
   - Use `cn()` from `@/lib/utils` for conditional classes

3. **State management** - if needed:
   - Redux slice in `gendox-frontend/src/store/`
   - Use `createAsyncThunk` for API calls
   - Use `useSelector` and `useDispatch` hooks

4. **API integration** in `gendox-frontend/src/gendox-sdk/`
   - Add service methods for API calls
   - Use the centralized API request config

5. **Navigation** - Add entry in `gendox-frontend/src/navigation/vertical/`

Use the Gendox color palette and shadcn/ui components. Ensure dark/light mode compatibility.
