import RoleRoute from './RoleRoute';
export default function ParentRoute({ children }) {
  return <RoleRoute allowed={['parent', 'admin']}>{children}</RoleRoute>;
}