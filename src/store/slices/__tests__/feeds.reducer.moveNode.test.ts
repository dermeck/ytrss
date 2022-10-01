import { InsertMode, NodeType } from '../../../model/feeds';
import feedsSlice, { FeedSliceState } from '../feeds';
import {
    feed1Fixture,
    feed2Fixture,
    feed3Fixture,
    folder1Fixture,
    folder2Fixture,
    folder3Fixture,
} from './feeds.fixtures';

describe('moveNode action', () => {
    describe('when moving folder nodes to new parent (InsertMode.Into)', () => {
        it('adds dragged folder to subfolderIds of target folder', () => {
            const prevState: FeedSliceState = {
                ...feedsSlice.getInitialState(),
                folders: [
                    { ...folder1Fixture, subfolderIds: [folder2Fixture.id] },
                    { ...folder2Fixture, subfolderIds: [folder3Fixture.id] },
                    { ...folder3Fixture },
                ],
            };

            const newState = feedsSlice.reducer(
                prevState,
                feedsSlice.actions.moveNode({
                    movedNode: {
                        nodeId: folder3Fixture.id,
                        nodeType: NodeType.Folder,
                    },
                    targetFolderNodeId: folder1Fixture.id,
                    mode: InsertMode.Into,
                }),
            );

            expect(newState.folders[0].subfolderIds).toContain(folder3Fixture.id);
        });

        it('removes dragged folder from subfolderIds of previous parent folder', () => {
            const prevState: FeedSliceState = {
                ...feedsSlice.getInitialState(),
                folders: [
                    { ...folder1Fixture, subfolderIds: [folder2Fixture.id] },
                    { ...folder2Fixture, subfolderIds: [folder3Fixture.id] },
                    { ...folder3Fixture },
                ],
            };

            const newState = feedsSlice.reducer(
                prevState,
                feedsSlice.actions.moveNode({
                    movedNode: {
                        nodeId: folder3Fixture.id,
                        nodeType: NodeType.Folder,
                    },
                    targetFolderNodeId: folder1Fixture.id,
                    mode: InsertMode.Into,
                }),
            );

            expect(newState.folders[1].subfolderIds).not.toContain(folder3Fixture.id);
        });
    });

    describe("when moving folder node to same parent (InsertMode.Into')", () => {
        it('does not change anything', () => {
            const prevState: FeedSliceState = {
                ...feedsSlice.getInitialState(),
                folders: [
                    { ...folder1Fixture, subfolderIds: [folder2Fixture.id] },
                    { ...folder2Fixture, subfolderIds: [folder3Fixture.id] },
                    { ...folder3Fixture },
                ],
            };

            const newState = feedsSlice.reducer(
                prevState,
                feedsSlice.actions.moveNode({
                    movedNode: {
                        nodeId: folder3Fixture.id,
                        nodeType: NodeType.Folder,
                    },
                    targetFolderNodeId: folder2Fixture.id,
                    mode: InsertMode.Into,
                }),
            );

            expect(newState.folders).toStrictEqual([
                { ...folder1Fixture, subfolderIds: [folder2Fixture.id] },
                { ...folder2Fixture, subfolderIds: [folder3Fixture.id] },
                { ...folder3Fixture },
            ]);
        });
    });

    describe('when moving folder to new parent (InsertMode.Before)', () => {
        it.todo('adds dragged folder to subfolderIds of target folders parent');
        it.todo('removes dragged folder from subfolderIds of previous parent folder');
        it.todo('adds dragged folder before target folder');
    });

    describe('when moving folder node to same parent (InsertMode.Before)', () => {
        // TODO
        it.skip('adds dragged folder before dragged over folder', () => {
            const prevState: FeedSliceState = {
                ...feedsSlice.getInitialState(),
                folders: [
                    { ...folder1Fixture, subfolderIds: [folder2Fixture.id, folder3Fixture.id] },
                    { ...folder2Fixture, subfolderIds: [] },
                    { ...folder3Fixture },
                ],
            };

            const newState = feedsSlice.reducer(
                prevState,
                feedsSlice.actions.moveNode({
                    movedNode: {
                        nodeId: folder3Fixture.id,
                        nodeType: NodeType.Folder,
                    },
                    targetFolderNodeId: folder2Fixture.id,
                    mode: InsertMode.Before,
                }),
            );

            expect(newState.folders).toStrictEqual([
                { ...folder1Fixture, subfolderIds: [folder3Fixture.id, folder2Fixture.id] },
                { ...folder2Fixture, subfolderIds: [] },
                { ...folder3Fixture },
            ]);
        });
    });

    describe('when moving folder to new parent (InsertMode.After)', () => {
        it.todo('adds dragged folder to subfolderIds of target folders parent');
        it.todo('removes dragged folder from subfolderIds of previous parent folder');
        it.todo('adds dragged folder after target folder');
    });

    describe('when moving folder node to same parent (InsertMode.Before)', () => {
        // TODO
        it.skip('adds dragged folder after dragged over folder', () => {
            const prevState: FeedSliceState = {
                ...feedsSlice.getInitialState(),
                folders: [
                    { ...folder1Fixture, subfolderIds: [folder2Fixture.id, folder3Fixture.id] },
                    { ...folder2Fixture, subfolderIds: [] },
                    { ...folder3Fixture },
                ],
            };

            const newState = feedsSlice.reducer(
                prevState,
                feedsSlice.actions.moveNode({
                    movedNode: {
                        nodeId: folder2Fixture.id,
                        nodeType: NodeType.Folder,
                    },
                    targetFolderNodeId: folder3Fixture.id,
                    mode: InsertMode.After,
                }),
            );

            expect(newState.folders).toStrictEqual([
                { ...folder1Fixture, subfolderIds: [folder3Fixture.id, folder2Fixture.id] },
                { ...folder2Fixture, subfolderIds: [] },
                { ...folder3Fixture },
            ]);
        });
    });

    describe('when moving feed nodes to new parent (InsertMode.Into)', () => {
        // TODO add tests for Before/After
        it('adds dragged feed to feedIds of target folder', () => {
            const prevState: FeedSliceState = {
                ...feedsSlice.getInitialState(),
                folders: [
                    { ...folder1Fixture, feedIds: [feed3Fixture.id], subfolderIds: [folder2Fixture.id] },
                    { ...folder2Fixture, feedIds: [feed1Fixture.id] },
                ],
            };

            const newState = feedsSlice.reducer(
                prevState,
                feedsSlice.actions.moveNode({
                    movedNode: {
                        nodeId: feed1Fixture.id,
                        nodeType: NodeType.Feed,
                    },
                    targetFolderNodeId: folder1Fixture.id,
                    mode: InsertMode.Into,
                }),
            );

            expect(newState.folders[0].feedIds).toStrictEqual([feed3Fixture.id, feed1Fixture.id]);
        });

        it('removes dragged feed from feedIds of previous parent folder', () => {
            const prevState: FeedSliceState = {
                ...feedsSlice.getInitialState(),
                folders: [
                    { ...folder1Fixture, feedIds: [], subfolderIds: [folder2Fixture.id] },
                    { ...folder2Fixture, feedIds: [feed1Fixture.id, feed2Fixture.id] },
                ],
            };

            const newState = feedsSlice.reducer(
                prevState,
                feedsSlice.actions.moveNode({
                    movedNode: {
                        nodeId: feed1Fixture.id,
                        nodeType: NodeType.Feed,
                    },
                    targetFolderNodeId: folder1Fixture.id,
                    mode: InsertMode.Into,
                }),
            );

            expect(newState.folders[1].feedIds).not.toContain(feed1Fixture.id);
            expect(newState.folders[1].feedIds).toStrictEqual([feed2Fixture.id]);
        });

        it('does not change anything if previous parent is the target', () => {
            const prevState: FeedSliceState = {
                ...feedsSlice.getInitialState(),
                folders: [
                    { ...folder1Fixture, feedIds: [], subfolderIds: [folder2Fixture.id] },
                    { ...folder2Fixture, feedIds: [feed1Fixture.id, feed2Fixture.id] },
                ],
            };

            const newState = feedsSlice.reducer(
                prevState,
                feedsSlice.actions.moveNode({
                    movedNode: {
                        nodeId: feed1Fixture.id,
                        nodeType: NodeType.Feed,
                    },
                    targetFolderNodeId: folder2Fixture.id,
                    mode: InsertMode.Into,
                }),
            );

            expect(newState.folders[1].feedIds).toStrictEqual([feed1Fixture.id, feed2Fixture.id]);
        });
    });
});
