import { TestType, User } from '@/drizzle/schema';

export default function TestResultTable({
  selection,
}: {
  selection: {
    players: Array<User>;
    types: Array<TestType>;
  };
}) {
  const { players, types } = selection;

  if (!players.length || !types.length) {
    return <div>No players or test types selected.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Player</th>
          {types.map((type) => (
            <th key={type.type_id}>{type.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {players.map((player) => (
          <tr key={player.user_id}>
            <td>{player.name}</td>
            {types.map((type) => (
              <td key={type.type_id}></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
