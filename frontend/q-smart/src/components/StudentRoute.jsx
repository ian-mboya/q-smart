import RoleRoute from './RoleRoute';
export default function StudentRoute({ children }) {
  return <RoleRoute allowed={['student', 'admin']}>{children}</RoleRoute>;
}