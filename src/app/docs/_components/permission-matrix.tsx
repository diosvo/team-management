import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable, type TypeNode } from 'fumadocs-ui/components/type-table';

import { RESOURCES } from '@/routes';
import { UserRole } from '@/utils/enum';
import {
  ALL_ACTIONS,
  CAPTAIN_PERMISSIONS,
  ROLE_CONFIG,
  type Action,
  type Resource,
  type RoleConfig,
} from '@/utils/permissions';

const ROLES = [
  UserRole.GUEST,
  UserRole.PLAYER,
  UserRole.COACH,
  UserRole.SUPER_ADMIN,
] as const;

const ROLE_LABEL: Record<UserRole, string> = {
  guest: 'GUEST',
  player: 'PLAYER',
  coach: 'COACH',
  super_admin: 'SUPER_ADMIN',
};

const CAPTAIN_LABEL = 'Captain (extra)';

const ROLE_DESCRIPTION: Record<UserRole, string> = {
  guest: 'Read-only visitor.',
  player: 'Standard team member.',
  coach: 'Coaching staff.',
  super_admin: 'Full access to every resource.',
};

const CAPTAIN_DESCRIPTION = 'Added on top of PLAYER when `is_captain` is true.';

function formatActions(actions: ReadonlyArray<Action> | undefined) {
  if (!actions?.length) return '—';
  if (ALL_ACTIONS.every((action) => actions.includes(action))) return 'all';
  return actions.join(', ');
}

/** One resource: a row per role, actions in the type column. */
function byRole(resource: Resource): Record<string, TypeNode> {
  const rows: Record<string, TypeNode> = {};

  for (const role of ROLES) {
    rows[ROLE_LABEL[role]] = {
      type: formatActions(ROLE_CONFIG[role][resource]),
      description: ROLE_DESCRIPTION[role],
      required: true,
    };
  }

  rows[CAPTAIN_LABEL] = {
    type: formatActions(CAPTAIN_PERMISSIONS[resource]),
    description: CAPTAIN_DESCRIPTION,
    required: true,
  };

  return rows;
}

/** One role: a row per resource it can touch. */
function byResource(
  config: RoleConfig,
  resources: ReadonlyArray<Resource>,
): Record<string, TypeNode> {
  const rows: Record<string, TypeNode> = {};

  for (const resource of resources) {
    const actions = config[resource];
    if (!actions?.length) continue;

    rows[resource] = { type: formatActions(actions), required: true };
  }

  return rows;
}

interface PermissionMatrixProps {
  /** Restrict the matrix to one or more resources; defaults to all. */
  resource?: Resource | Array<Resource>;
}

/**
 * Role × resource permissions rendered straight from `ROLE_CONFIG` and
 * `CAPTAIN_PERMISSIONS`, so the docs can never drift from the code.
 *
 * A single resource renders one TypeTable (row per role). Several resources
 * render one tab per role, each listing the resources that role can reach.
 */
export function PermissionMatrix({ resource }: PermissionMatrixProps) {
  const resources: ReadonlyArray<Resource> = resource
    ? Array.isArray(resource)
      ? resource
      : [resource]
    : RESOURCES;

  if (resources.length === 1) {
    return <TypeTable type={byRole(resources[0])} />;
  }

  const items = [...ROLES.map((role) => ROLE_LABEL[role]), CAPTAIN_LABEL];

  return (
    <Tabs items={items}>
      {ROLES.map((role) => (
        <Tab key={role} value={ROLE_LABEL[role]}>
          <TypeTable type={byResource(ROLE_CONFIG[role], resources)} />
        </Tab>
      ))}
      <Tab value={CAPTAIN_LABEL}>
        <TypeTable type={byResource(CAPTAIN_PERMISSIONS, resources)} />
      </Tab>
    </Tabs>
  );
}
