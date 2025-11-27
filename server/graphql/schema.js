// graphql/schema.js
const { buildSchema } = require('graphql');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

const schema = buildSchema(`
  scalar JSON

  type User {
    id: ID!
    login: String!
    name: String
    role: String!
  }

  type Project {
    id: ID!
    title: String!
    description: String!
    createdBy: User!
    createdAt: String!
    updatedAt: String!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: String!
    project: Project!
    assignee: User
    due: String
    createdAt: String!
    updatedAt: String!
  }

  input ProjectInput {
    title: String!
    description: String
  }

  type Query {
    projects: [Project!]!
    project(id: ID!): Project
    tasks: [Task!]!
  }

  type Mutation {
    createProject(input: ProjectInput!): Project
    updateProject(id: ID!, input: ProjectInput!): Project
    deleteProject(id: ID!): Boolean
  }
`);

const root = {
    projects: async (rootValue, args, req) => {
        // req теперь доступен как context.req
        req = args.req
        console.log("rootvalue: ", rootValue)
        console.log("args:", args)

        req = args.req

        console.log("GraphQL Resolver 'projects': req from context.req:", req); // Лог для отладки
        console.log("GraphQL Resolver 'projects': req.user from context.req:", req?.user); // Лог для отладки

        if (!req || !req.user) {
            throw new Error('Authentication required');
        }

        if (req.user.role === 'admin') {
            return await Project.find()
                .populate('createdBy', 'login name role')
                .sort({ createdAt: -1 });
        } else {
            const tasksWithUser = await Task.find({ assignee: req.user.id }).distinct('project');
            return await Project.find({ _id: { $in: tasksWithUser } })
                .populate('createdBy', 'login name role')
                .sort({ createdAt: -1 });
        }
    },

    project: async (rootValue, args, req) => {
        req = args.req // req извлекается как context.req
        const { _id } = args;

        if (!req || !req.user) {
            throw new Error('Authentication required');
        }

        const project = await Project.findById(_id).populate('createdBy', 'login name role');
        if (!project) {
            throw new Error('Project not found');
        }

        if (req.user.role === 'admin') {
            return project;
        }

        const userTasksInProject = await Task.findOne({ project: _id, assignee: req.user.id });
        const hasTasksAsAssignee = !!userTasksInProject;

        if (!hasTasksAsAssignee) {
            throw new Error('Access forbidden');
        }

        return project;
    },

    createProject: async (rootValue, args, req) => {
        req = args.req // req извлекается как context.req
        if (!req || !req.user) {
            throw new Error('Authentication required');
        }

        const { input } = args;
        const project = new Project({
            title: input.title,
            description: input.description || '',
            createdBy: req.user.id,
        });

        await project.save();
        await project.populate('createdBy', 'login name role');
        return project;
    },

    updateProject: async (rootValue, args, req) => {
        req = args.req // req извлекается как context.req
        if (!req || !req.user) {
            throw new Error('Authentication required');
        }

        const { id, input } = rootValue;
        const project = await Project.findById(id);
        if (!project) {
            throw new Error('Project not found');
        }

        if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user.id) {
            throw new Error('Недостаточно прав для изменения проекта');
        }

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { title: input.title, description: input.description },
            { new: true, runValidators: true }
        ).populate('createdBy', 'login name role');

        return updatedProject;
    },

    deleteProject: async (rootValue, args, req) => {
        req = args.req // req извлекается как context.req
        if (!req || !req.user) {
            throw new Error('Authentication required');
        }

        const { id } = rootValue;
        const project = await Project.findById(id);
        if (!project) {
            throw new Error('Project not found');
        }

        if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user.id) {
            throw new Error('Недостаточно прав для удаления проекта');
        }

        await Task.deleteMany({ project: id });
        await Project.findByIdAndDelete(id);
        return true;
    },
    
    tasks: async (rootValue, args, req) => {
    req = args.req;
    if (!req || !req.user) throw new Error('Authentication required');

    if (req.user.role === 'admin') {
      return await Task.find()
        .populate('project', 'id title')
        .populate('assignee', 'id login name role')
        .sort({ createdAt: -1 });
    } else {
      return await Task.find({ assignee: req.user.id })
        .populate('project', 'id title')
        .populate('assignee', 'id login name role')
        .sort({ createdAt: -1 });
    }
  },
};

module.exports = { schema, root };