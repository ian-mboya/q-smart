import RoleRoute from './RoleRoute';
export default function AdminRoute({ children }) {
  return <RoleRoute allowed={['admin']}>{children}</RoleRoute>;
}