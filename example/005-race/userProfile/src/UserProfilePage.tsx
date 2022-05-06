import React from 'react';

type UserProfile = { id: string; name: string };

type Props = {
  userId: string;
  bug?: 1;
  // Injected as a props because CodeSandbox fails to provide jest.mock
  // Otherwise we might have direclty imported it and mock the import
  getUserProfile: (userId: string) => Promise<UserProfile>;
};

export default function UserPageProfile(props: Props) {
  const [userData, setUserData] = React.useState(null as UserProfile | null);

  React.useEffect(() => {
    let canceled = false;
    const fetchUser = async () => {
      setUserData(null); // reset on fetch
      const data = await props.getUserProfile(props.userId);
      if (!canceled || props.bug !== undefined) setUserData(data);
    };
    fetchUser();
    return () => {
      canceled = true;
    };
  }, [props.getUserProfile, props.userId, props.bug]);

  if (userData === null) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user-id">Id: {userData.id}</div>
      <div data-testid="user-name">Name: {userData.name}</div>
    </div>
  );
}
